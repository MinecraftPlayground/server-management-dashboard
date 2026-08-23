import type { ReactiveElement } from '@lit';

/**
 * Options for the queryAssignedElementsDeep decorator.
 * Matches the API of Lit's native queryAssignedElements.
 */
export interface QueryAssignedElementsDeepOptions {
  /**
   * Slot name to query. Leave undefined for the default slot.
   */
  slot? : string;
  /**
   * Flattens the assigned nodes by replacing any child <slot> elements 
   * with their assigned nodes (recursive distribution).
   */
  flatten? : boolean;
  /**
   * CSS selector to filter the returned elements.
   */
  selector? : string;
}

export type QueryAssignedElementsDeepDecorator<QueriedElement extends Element = Element> = <
  CurrentElement extends ReactiveElement
>(
  value: ClassAccessorDecoratorTarget<CurrentElement, QueriedElement[]>,
  context: ClassAccessorDecoratorContext<CurrentElement, QueriedElement[]>
) => ClassAccessorDecoratorResult<CurrentElement, QueriedElement[]>;

/**
 * Recursively collects elements from a root, traversing into shadow roots.
 */
function deepCollectElements<QueriedElement extends Element>(
  root : Element | Document | DocumentFragment | HTMLSlotElement,
  selector : string | undefined,
  flatten : boolean,
  collected : QueriedElement[]
): void {
  const visit = (node: Element): void => {
    // deno-lint-ignore no-undef
    if (node instanceof HTMLSlotElement) {
      for (const assigned of node.assignedElements({ flatten })) {
        visit(assigned);
      }
      return;
    }

    if (!selector || node.matches(selector)) {
      collected.push(node as QueriedElement);
    }

    // Walk every host, even when it does not match the selector. Its shadow
    // root can contain matching elements.
    for (const child of Array.from(node.children)) {
      visit(child);
    }

    if (node.shadowRoot) {
      deepCollectElements(node.shadowRoot, selector, flatten, collected);
    }
  };

  // deno-lint-ignore no-undef
  if (root instanceof HTMLSlotElement) {
    for (const assigned of root.assignedElements({ flatten })) {
      visit(assigned);
    }
  } else {
    for (const child of Array.from(root.children)) {
      visit(child);
    }
  }
}

/**
 * A property decorator that converts a class property into a getter that
 * returns the `assignedElements` of the given `slot` recursively. Provides a declarative
 * way to use
 * [`HTMLSlotElement.assignedElements`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assignedElements).
 *
 * Can be passed an optional {@linkcode QueryAssignedElementsDeepOptions} object.
 *
 * Example usage:
 * ```ts
 * class MyElement {
 *   @queryAssignedElementsDeep({ slot: 'list' })
 *   listItems!: Array<HTMLElement>;
 *   @queryAssignedElementsDeep()
 *   unnamedSlotEls!: Array<HTMLElement>;
 *
 *   render() {
 *     return html`
 *       <slot name="list"></slot>
 *       <slot></slot>
 *     `;
 *   }
 * }
 * ```
 *
 * Note, the type of this property should be annotated as `Array<HTMLElement>`.
 *
 * @category Decorator
 */
export function queryAssignedElementsDeep<QueriedElement extends Element = Element>(
  options: QueryAssignedElementsDeepOptions = {}
) : QueryAssignedElementsDeepDecorator<QueriedElement> {
  return <CurrentElement extends ReactiveElement>(
    _value: ClassAccessorDecoratorTarget<CurrentElement, QueriedElement[]>,
    context: ClassAccessorDecoratorContext<CurrentElement, QueriedElement[]>
  ): ClassAccessorDecoratorResult<CurrentElement, QueriedElement[]> => {
    if (context.kind !== 'accessor') {
      throw new Error(`@queryAssignedElementsDeep can only be used on accessors.`);
    }

    const { slot, flatten = false, selector } = options;

    return {
      get(this: CurrentElement) : QueriedElement[] {
        if (!this.renderRoot) return [];

        const slotElement = Array.from(
          this.renderRoot.querySelectorAll<HTMLSlotElement>('slot')
        ).find((candidate) =>
          slot === undefined
            ? !candidate.hasAttribute('name')
            : candidate.name === slot
        );

        if (!slotElement) return [];

        const results: QueriedElement[] = [];

        deepCollectElements<QueriedElement>(slotElement, selector, flatten, results);

        return results;
      },
    };
  };
}   
