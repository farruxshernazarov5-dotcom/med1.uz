import rawPart42 from "./raw/tibbiy-maqolalar-fayl12.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart42 = parseMarkdownArticles(rawPart42, 356);
