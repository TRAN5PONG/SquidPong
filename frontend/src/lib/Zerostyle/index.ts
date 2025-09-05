import Zeroact from "@/lib/Zeroact";

export interface state {
  currentSelector: string;
  selectorStack: string[];
  currentProperties: string[];
  outPutRules: string[];
  braceLevel: number;
}

class CssParser {
  private static classCount = 0;
  private static styleSheet: CSSStyleSheet | null = null;
  private static injectedStyles = new Set<string>(); // Track injected CSS rules

  static getStyleSheet(): CSSStyleSheet {
    if (!this.styleSheet) {
      const style = document.createElement("style");
      document.head.appendChild(style);
      this.styleSheet = style.sheet!;
    }
    return this.styleSheet;
  }
  
  static generateClassName() {
    return `styled-${++this.classCount}`;
  }
  
  static parseNestedCSS(cssText: string, rootClassName: string): string {
    let multilineBuffer: string | null = null;

    // Use line-based parsing for better brace handling
    const lines = cssText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);

    const state: state = {
      currentSelector: `.${rootClassName}`,
      selectorStack: [`.${rootClassName}`],
      currentProperties: [] as string[],
      outPutRules: [] as string[],
      braceLevel: 0,
    };

    for (const line of lines) {
      if (multilineBuffer) {
        multilineBuffer = `${multilineBuffer} ${line}`;

        if (line.trim().endsWith(";")) {
          this.processLine(multilineBuffer, state);
          multilineBuffer = null;
        }
        continue;
      }

      if (this.isProperty(line) && !line.trim().endsWith(";")) {
        multilineBuffer = line;
        continue;
      }

      this.processLine(line, state);
    }

    this.flushCurrentProperties(state);
    return state.outPutRules.join("\n");
  }
  
  private static processLine(line: string, state: state): void {
    if (line.includes("{")) {
      const beforeBrace = line.substring(0, line.indexOf("{")).trim(); // i expect to always have a selector before the brace (duo to formatting)
      const afterBrace = line.substring(line.indexOf("{") + 1).trim();

      if (beforeBrace && this.isSelector(beforeBrace)) {
        this.handleNestedSelector(beforeBrace, state);
      }
      state.braceLevel++;

      if (afterBrace && this.isProperty(afterBrace)) {
        state.currentProperties.push(afterBrace); // again, if something is after the brace, i expect it to be a property
      }
    }
    // Handle closing braces
    else if (line.includes("}")) {
      this.flushCurrentProperties(state);
      state.braceLevel--;

      // Pop the last selector
      if (state.selectorStack.length > 1) {
        state.selectorStack.pop();
        state.currentSelector =
          state.selectorStack[state.selectorStack.length - 1];
      }
    }
    // Handle properties
    else if (this.isProperty(line)) {
      state.currentProperties.push(line);
    }
    // Handle selectors without braces on the same line
    else if (this.isSelector(line)) {
      this.handleNestedSelector(line, state);
    }
  }
  
  private static isProperty(token: string): boolean {
    const trimmed = token.trim();

    // Must have a colon and not start with selector-like tokens
    const hasColon = trimmed.includes(":");
    const isLikelySelector = trimmed.startsWith(".") || trimmed.startsWith("&");

    return (
      hasColon &&
      !isLikelySelector &&
      !trimmed.includes("{") &&
      !trimmed.includes("}")
    );
  }
  
  private static isSelector(token: string): boolean {
    const trimmed = token.trim();

    // Accept compound selectors like `input::placeholder`, `input:focus`, etc.
    const containsSelectorLikeParts =
      /[.#:\[]/.test(trimmed) || /\s/.test(trimmed);

    return (
      trimmed.startsWith(".") ||
      trimmed.startsWith("&") ||
      /^[a-zA-Z]/.test(trimmed) ||
      containsSelectorLikeParts
    );
  }

  private static flushCurrentProperties(state: state): void {
    if (state.currentProperties.length > 0) {
      const properties = state.currentProperties
        .map((prop) => (prop.endsWith(";") ? prop : prop + ";"))
        .join(" ");

      const rule = `${state.currentSelector} { ${properties} }`;
      state.outPutRules.push(rule);
      state.currentProperties = [];
    }
  }

  // This function will build the selector based on the parent and child
  // ex : parent = "StyledDiv", child = "&:hover" ====> "StyledDiv:hover"
  private static buildSelector(parent: string, child: string): string {
    child = child.trim();

    if (child.startsWith("&")) {
      return parent + child.substring(1);
    }

    // Pseudo-element or pseudo-class
    if (child.startsWith("::") || child.startsWith(":")) {
      return `${parent}${child}`; // No space — it's a modifier on the last element
    }

    return `${parent} ${child}`; // Regular nested selector
  }

  private static handleNestedSelector(selector: string, state: state): void {
    this.flushCurrentProperties(state);

    const parentSelector = state.selectorStack[state.selectorStack.length - 1];
    const newSelector = this.buildSelector(parentSelector, selector);

    state.currentSelector = newSelector;
    state.selectorStack.push(newSelector);
  }
  
  static injectCSS(cssRules: string): void {
    // Prevent duplicate injection
    if (this.injectedStyles.has(cssRules)) {
      return;
    }
    
    this.injectedStyles.add(cssRules);
    const styleSheet = this.getStyleSheet();
    const rules = cssRules.split("\n").filter((rule) => rule.trim());

    rules.forEach((rule) => {
      try {
        styleSheet.insertRule(rule, styleSheet.cssRules.length);
      } catch (e) {
        console.warn("Failed to inject CSS rule:", rule, e);
      }
    });
  }
}

// Cache for styled components: Map<styleString, className>
const styleCache = new Map<string, string>();

export function styled<K extends keyof HTMLElementTagNameMap>(HtmlTag: K) {
  return (styles: TemplateStringsArray, ...exprs: any[]) => {
    
    return (props: any) => {
      // Evaluate template literal expressions
      const styleString = styles.reduce((acc, curr, i) => {
        const expr = exprs[i];
        const value = typeof expr === "function" ? expr(props) : expr ?? "";
        return acc + curr + value;
      }, "");

      // Check if we already have a class name for this exact style string
      let className = styleCache.get(styleString);
      
      if (!className) {
        // Generate new class name and cache it
        className = CssParser.generateClassName();
        styleCache.set(styleString, className);
        
        // Parse and inject CSS only once
        const parsedCSS = CssParser.parseNestedCSS(styleString, className);
        CssParser.injectCSS(parsedCSS);
      }

      // Combine existing className with generated one
      const finalClassName = props.className
        ? `${props.className} ${className}`
        : className;

      return Zeroact.createElement(
        HtmlTag,
        {
          ...props,
          className: finalClassName,
        },
        ...(Array.isArray(props.children) ? props.children : [props.children])
      );
    };
  };
}