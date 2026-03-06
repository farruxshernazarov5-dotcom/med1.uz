import rawPart30 from "./raw/tibbiy-maqolalar-30.md?raw";
import { parseMarkdownArticles } from "./markdownParser";

export const articlesPart30 = parseMarkdownArticles(rawPart30, 291);
