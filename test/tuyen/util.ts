import PeerId from "peer-id";
import * as fs from "fs";
import * as path from "path";
import {ENR} from "../../src/enr/enr";
import {load, dump, FAILSAFE_SCHEMA, Schema, Type} from "js-yaml"

export async function readPeerId(filename: string): Promise<PeerId> {
  return await PeerId.createFromJSON(await readFile(filename));
}

export async function readEnr(filename: string): Promise<ENR> {
  return ENR.decodeTxt(await readFile(filename));
}

/**
 * Read a JSON serializable object from a file
 *
 * Parse either from json, yaml, or toml
 */
export async function readFile<T>(filename: string): Promise<T> {
  const fileFormat = path.extname(filename).substr(1);
  const contents = await fs.promises.readFile(filename, "utf-8");
  return parse(contents, fileFormat as FileFormat);
}

export function parse<T>(contents: string, fileFormat: FileFormat): T {
  switch (fileFormat) {
    case FileFormat.json:
      return JSON.parse(contents);
    case FileFormat.yaml:
      return load(contents, {schema: yamlSchema});
    default:
      throw new Error("Invalid filetype");
  }
}

export enum FileFormat {
  json = "json",
  yaml = "yaml",
  toml = "toml",
}

export const yamlSchema = new Schema({
  include: [FAILSAFE_SCHEMA],
  implicit: [
    new Type("tag:yaml.org,2002:str", {
      kind: "scalar",
      construct: function (data) {
        return data !== null ? data : "";
      },
    }),
  ],
});