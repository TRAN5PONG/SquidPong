declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }

  interface Element {
    type: string | FunctionComponent;
    props: {
      children: any[];
      [key: string]: any;
    };
  }

  interface ElementChildrenAttribute {
    children: {};
  }

  type ElementType = string | FunctionComponent;
}

type FunctionComponent = (props: any) => JSX.Element | null;