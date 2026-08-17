/**
 * Derive a catalog item's public API from React TypeScript source by asking
 * the same compiler profile `check-strict-consumer` already uses. Hand-written
 * prop lists drift; this reads the props type out of `tsc` so `balsa info`
 * reports types and enumerated unions that are true by construction.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { itemPath, loadTargetRegistry, rootDir } from "./registry-lib.mjs";
import { createSiteTypeScriptPaths } from "./site-aliases.mjs";

const checkedExtensions = new Set([".ts", ".tsx"]);

function cleanType(type) {
  return type.replace(/\s+/g, " ").trim();
}

const opaqueTypes = new Set([
  "Date", "RegExp", "Error", "Element", "HTMLElement", "Event", "File", "Blob",
  "Function", "Promise", "Node", "URL", "FormData",
  "LucideIcon", "IconComponent", "ReactNode", "ReactElement", "ReactPortal",
  "CSSProperties", "StyleProp",
]);

function printedTypeNames(printed) {
  return printed.split("|").map((part) => part.trim()).filter((part) => (
    part && part !== "undefined" && part !== "null"
  ));
}

async function collectTargetTypeScriptFiles(target) {
  const registry = await loadTargetRegistry(target);
  const files = [];
  for (const item of registry?.items ?? []) {
    for (const file of item.files ?? []) {
      const posix = file.path.split("\\").join("/");
      if (!checkedExtensions.has(path.extname(posix))) continue;
      files.push(itemPath(posix, { target }));
    }
  }
  return [...new Set(files)].sort();
}

async function createReactTypeScriptProgram(rootNames) {
  const generatedDir = path.join(rootDir, "node_modules", ".tmp");
  await mkdir(generatedDir, { recursive: true });
  const configPath = path.join(generatedDir, "tsconfig.contracts-react.json");
  const includesTsx = rootNames.some((file) => path.extname(file) === ".tsx");
  await writeFile(configPath, `${JSON.stringify({
    compilerOptions: {
      noEmit: true,
      types: ["vite/client"],
      paths: createSiteTypeScriptPaths(rootDir),
      strict: true,
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "Bundler",
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      skipLibCheck: true,
      isolatedModules: true,
      resolveJsonModule: true,
      ...(includesTsx ? { jsx: "react-jsx" } : {}),
    },
    include: rootNames,
  }, null, 2)}\n`);
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );
  return ts.createProgram({
    rootNames: parsed.fileNames.length ? parsed.fileNames : rootNames,
    options: parsed.options,
  });
}

function typeString(checker, type) {
  return cleanType(checker.typeToString(
    type,
    undefined,
    ts.TypeFormatFlags.NoTruncation,
  ));
}

function isOptionalSymbol(symbol) {
  return Boolean(symbol.flags & ts.SymbolFlags.Optional);
}

function isUndefinedType(type) {
  return Boolean(type.flags & ts.TypeFlags.Undefined);
}

function literalValue(type, checker) {
  if (type.isStringLiteral()) return type.value;
  if (type.isNumberLiteral()) return String(type.value);
  if (type.flags & ts.TypeFlags.BooleanLiteral) return checker.typeToString(type);
  if (type.flags & ts.TypeFlags.Null) return "null";
  return null;
}

function enumeratedValuesFromType(type, checker) {
  const parts = type.isUnion() ? type.types : [type];
  const members = [];
  for (const part of parts) {
    if (isUndefinedType(part)) continue;
    const value = literalValue(part, checker);
    if (value === null) return undefined;
    members.push(value);
  }
  if (!members.length || members.length > 40) return undefined;
  if (members.some((value) => /[{}()[\]]/.test(value))) return undefined;
  return members;
}

function isAuthoredSymbol(symbol) {
  return (symbol.getDeclarations() ?? []).some((declaration) => {
    const fileName = declaration.getSourceFile().fileName.split("\\").join("/");
    return !fileName.includes("/node_modules/");
  });
}

function coreObjectType(checker, type) {
  if (type.isUnion()) {
    const objects = type.types.filter((part) => (
      !isUndefinedType(part) && (part.flags & ts.TypeFlags.Object)
    ));
    if (objects.length === 1) return objects[0];
    return undefined;
  }
  if (type.flags & ts.TypeFlags.Object) return type;
  return undefined;
}

function describeShapeFromType(checker, type, depth = 0) {
  if (depth > 3) return undefined;
  const printed = typeString(checker, type);
  if (printedTypeNames(printed).some((name) => (
    opaqueTypes.has(name)
    || name.startsWith("ReactElement")
    || name.startsWith("Promise<")
    || name.startsWith("JSXElementConstructor")
  ))) return undefined;
  if (type.getCallSignatures().length) return undefined;

  if (type.isUnion()) {
    const objectParts = type.types.filter((part) => (
      !isUndefinedType(part)
      && !part.isLiteral()
      && !(part.flags & ts.TypeFlags.BooleanLiteral)
      && (part.flags & ts.TypeFlags.Object)
    ));
    if (objectParts.length > 1) {
      const variants = objectParts
        .slice(0, 6)
        .map((part) => describeShapeFromType(checker, part, depth + 1))
        .filter(Boolean);
      if (!variants.length) return undefined;
      return variants.length === 1
        ? variants[0]
        : { type: printed, variants };
    }
  }

  const objectType = coreObjectType(checker, type);
  if (!objectType) return undefined;
  if (checker.isArrayType(objectType)) {
    const itemType = checker.getTypeArguments(objectType)[0];
    if (!itemType) return undefined;
    const items = describeShapeFromType(checker, itemType, depth + 1);
    if (!items) return undefined;
    return { type: printed, items };
  }

  const fields = objectType.getProperties()
    .filter((symbol) => !symbol.getName().startsWith("__"))
    .slice(0, 25)
    .map((symbol) => {
      const fieldType = checker.getTypeOfSymbol(symbol);
      return {
        name: symbol.getName(),
        type: typeString(checker, fieldType),
        required: !isOptionalSymbol(symbol),
      };
    });
  return fields.length ? { type: printed, fields } : undefined;
}

function describePropFromSymbol(checker, symbol) {
  const type = checker.getTypeOfSymbol(symbol);
  const values = enumeratedValuesFromType(type, checker);
  const shape = values ? undefined : describeShapeFromType(checker, type);
  return {
    name: symbol.getName(),
    type: typeString(checker, type),
    ...(values ? { values } : {}),
    ...(shape ? { shape } : {}),
    required: !isOptionalSymbol(symbol),
  };
}

function pascalCaseName(name) {
  return name.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
}

function resolveExportSymbol(checker, symbol) {
  if (symbol.flags & ts.SymbolFlags.Alias) {
    try {
      return checker.getAliasedSymbol(symbol);
    } catch {
      return symbol;
    }
  }
  return symbol;
}

function isComponentValue(symbol) {
  return Boolean(symbol.flags & (
    ts.SymbolFlags.Function | ts.SymbolFlags.Variable | ts.SymbolFlags.Class
  ));
}

function exportedComponentSymbol(checker, sourceFile, itemName) {
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) return undefined;
  const exports = checker.getExportsOfModule(moduleSymbol)
    .map((symbol) => resolveExportSymbol(checker, symbol))
    .filter(isComponentValue);
  if (!exports.length) return undefined;
  const expected = pascalCaseName(itemName);
  return exports.find((symbol) => symbol.getName() === expected)
    ?? exports.find((symbol) => symbol.getName() === "default")
    ?? exports[0];
}

function propsTypeOfComponent(checker, symbol) {
  const type = checker.getTypeOfSymbol(symbol);
  const signatures = [
    ...type.getCallSignatures(),
    ...type.getConstructSignatures(),
  ];
  for (const signature of signatures) {
    const parameter = signature.parameters[0];
    if (!parameter) continue;
    return checker.getTypeOfSymbol(parameter);
  }
  return undefined;
}

function sourceFileOf(program, componentAbsPath) {
  return program.getSourceFile(componentAbsPath)
    ?? program.getSourceFile(componentAbsPath.split("\\").join("/"))
    ?? program.getSourceFile(componentAbsPath.split("/").join(path.sep));
}

export async function createTypescriptPropsExtractor(target) {
  const rootNames = await collectTargetTypeScriptFiles(target);
  if (!rootNames.length) {
    return { extract() { return undefined; } };
  }
  const program = await createReactTypeScriptProgram(rootNames);
  const checker = program.getTypeChecker();

  return {
    extract(componentAbsPath, relativePath, item) {
      const sourceFile = sourceFileOf(program, componentAbsPath);
      if (!sourceFile) return undefined;
      const component = exportedComponentSymbol(checker, sourceFile, item.name);
      if (!component) return undefined;
      const propsType = propsTypeOfComponent(checker, component);
      if (!propsType) return undefined;

      const props = propsType.getProperties()
        .filter(isAuthoredSymbol)
        .filter((symbol) => !symbol.getName().startsWith("__"))
        .sort((left, right) => (
          (left.valueDeclaration?.pos ?? 0) - (right.valueDeclaration?.pos ?? 0)
        ))
        .map((symbol) => describePropFromSymbol(checker, symbol));

      if (!props.length) return undefined;

      return {
        source: relativePath,
        props,
        events: [],
        slots: [],
      };
    },
  };
}
