import { settings, select } from "../settings.js";
import BaseWidget from "./basewidget.js";

class AmountWidget extends BaseWidget {
  constructor(element) {
    super(element, settings.amountWidget.defaultValue);
    const thisWidget = this;
    thisWidget.getElements(element);
    thisWidget.initActions();
    thisWidget.renderValue();
  }

  getElements() {
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(
      select.widgets.amount.input
    );

    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(
      select.widgets.amount.linkDecrease
    );
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(
      select.widgets.amount.linkIncrease
    );
  }

  isValid(value) {
    return (
      !isNaN(value) &&
      settings.amountWidget.defaultMax >= value &&
      value >= settings.amountWidget.defaultMin
    );
  }

  renderValue() {
    const thisWidget = this;
    thisWidget.dom.input.value = thisWidget.value;
  }

  initActions() {
    const thisWidget = this;
    thisWidget.dom.input.addEventListener("change", function (event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.dom.input.value);
    });

    thisWidget.dom.linkDecrease.addEventListener("click", function (event) {
      event.preventDefault();
      console.log("clicked remove");
      thisWidget.setValue(parseInt(thisWidget.dom.input.value) - 1);
    });

    thisWidget.dom.linkIncrease.addEventListener("click", function (event) {
      event.preventDefault();
      console.log("clicked add");
      console.log(thisWidget.value);
      thisWidget.setValue(parseInt(thisWidget.dom.input.value) + 1);
    });
  }
}

export default AmountWidget;
