import rawPart24 from "./raw/tibbiy-maqolalar-24.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart24 = parseMarkdownArticles(rawPart24, 231);
