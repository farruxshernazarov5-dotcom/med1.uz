import rawPart18 from "./raw/tibbiy-maqolalar-18.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart18 = parseMarkdownArticles(rawPart18, 171);
