export declare namespace Ast {
  export type Literal = string | number | boolean | null | RegExp;

  export interface Capture {
    name: string;
    filters: Filter[];
    // 当用户没有提供 modifier 时，解析结果中该字段为 null
    modifier: Modifier | null;
  }

  export interface Filter {
    isArrayFilter: boolean;
    name: string;
    args: Literal[];
  }

  export interface Modifier {
    name: string;
    args: Literal[];
  }

  export type Selector =
    | ParentRefSelector
    | NormalSelector
    | Assignment
    | SnippetDefine
    | SnippetExpand
    | FilterDefine
    | ModifierDefine
    | ProcedureDefine;

  export type ExpandedSelector =
    | ParentRefSelector
    | NormalSelector
    | Assignment
    | SnippetDefine
    | FilterDefine
    | ModifierDefine
    | ProcedureDefine;

  export interface NormalSelector {
    type: 'normal-selector';
    sections: Section[];
    // 当用户没有提供 procedure 时，该字段为 null
    procedure: Procedure | null;
    // 当用户没有提供 arrayCapture 时，该字段为 null
    arrayCapture: Capture | null;
    children: Selector[];
  }

  export interface ParentRefSelector {
    type: 'parent-ref-selector';
    section: Section;
    // 当用户没有提供 procedure 时，该字段为 null
    procedure: Procedure;
  }

  export interface Procedure {
    name: string;
    args: (Literal | Capture)[];
  }

  export interface Assignment {
    type: 'assignment';
    capture: Capture;
    value: Literal;
  }

  export interface SnippetDefine {
    type: 'snippet-define';
    name: string;
    selectors: Selector[];
  }

  export interface SnippetExpand {
    type: 'snippet-expand';
    name: string;
  }

  export interface FilterDefine {
    type: 'filter-define';
    name: string;
    argsPart: string;
    code: string;
  }

  export interface ModifierDefine {
    type: 'modifier-define';
    name: string;
    argsPart: string;
    code: string;
  }

  export interface ProcedureDefine {
    type: 'procedure-define';
    name: string;
    argsPart: string;
    code: string;
  }

  export interface Section {
    combinator: Combinator;
    element: string;
    qualifiers: Qualifier[];
  }

  export type Combinator = ' ' | '>' | '+' | '~';

  export type Qualifier = IdQualifier | ClassQualifier | AttributeQualifier | PseudoQualifier;

  export interface IdQualifier {
    type: 'id-qualifier';
    id: string;
  }

  export interface ClassQualifier {
    type: 'class-qualifier';
    className: string;
  }

  export type AttributeOperator = '=' | '~=' | '|=' | '*=' | '^=' | '$=';

  export interface AttributeQualifier {
    type: 'attribute-qualifier';
    attribute: string;
    operator: AttributeOperator;
    value: string | Capture;
  }

  export interface PseudoQualifier {
    type: 'pseudo-qualifier';
    name: string;
    content: string;
  }
}

export declare class SyntaxError extends Error {}

export declare function parse(source: string): Ast.Selector[];
