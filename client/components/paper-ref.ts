import { Quill } from "@vueup/vue-quill";

const Embed = Quill.import("blots/embed");

/**
 * Simplified version of the quill-mention blot class; this just adds automatic
 * link generation from ids
 */
class MentionLink extends Embed {
  static create(data: Record<string, string>) {
    const node: HTMLElement = super.create();
    node.addEventListener("click", (e) => {
      const event = new CustomEvent("mention-clicked", {
        bubbles: true,
        cancelable: true,
        detail: data,
      });
      window.dispatchEvent(event);
    });
    node.setAttribute("href", "/notes/" + data.id);

    node.textContent = data.value;
    return MentionLink.setDataValues(node, data);
  }

  static setDataValues(element: HTMLElement, data: Record<string, string>) {
    const domNode = element;
    domNode.dataset.id = data.id;
    domNode.dataset.value = data.value;
    return domNode;
  }

  static value(domNode: HTMLElement) {
    return domNode.dataset;
  }

  static blotName = "mentionLink";
  static className = "mention";

  static tagName = "a";
}

Quill.register(MentionLink);
