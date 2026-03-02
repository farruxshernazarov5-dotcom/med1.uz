import rawPart22 from "./raw/tibbiy-maqolalar-22.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart22 = parseMarkdownArticles(rawPart22, 211);
