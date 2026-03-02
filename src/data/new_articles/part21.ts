import rawPart21 from "./raw/tibbiy-maqolalar-21.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart21 = parseMarkdownArticles(rawPart21, 201);
