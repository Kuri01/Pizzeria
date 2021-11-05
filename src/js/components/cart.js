import { settings, select, classNames, templates } from '../settings.js';
import { utils } from '../utils.js';
import CartProduct from './cartproduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
    thisCart.update();
  }

  getElements(element) {
    const thisCart = this;
    thisCart.dom = [];
    thisCart.dom.wrapper = element;
    thisCart.dom.form = element.querySelector(select.cart.form);
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
      select.cart.toggleTrigger
    );
    thisCart.dom.productList = document.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = element.querySelector(
      select.cart.subtotalPrice
    );
    thisCart.dom.totalPrice = element.querySelector(select.cart.totalPrice);
    thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function () {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.productList.addEventListener('updated', function () {
      thisCart.update();
    });

    thisCart.dom.productList.addEventListener('remove', function (event) {
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct) {
    const thisCart = this;
    function generateProduct() {
      // generate HTML based on template
      const generatedHTML = templates.cartProduct(menuProduct);
      // create element using utils.createElementFromHTML
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      // add element to menu
      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    }

    generateProduct();
    thisCart.update();
  }

  update() {
    const thisCart = this;
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
    thisCart.totalPrice = 0;

    for (let product of thisCart.products) {
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price * product.amount;
    }

    if (thisCart.subtotalPrice != 0) {
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    }

    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
  }

  remove(cartProduct) {
    const thisCart = this;
    const indexCartProduct = thisCart.products.indexOf(cartProduct);
    thisCart.products.splice(indexCartProduct, 1);
    cartProduct.dom.wrapper.remove();
    this.update();
  }

  getClientInfo() {
    const thisCart = this;

    thisCart.dom.address = document.querySelector(select.cart.address).value;
    thisCart.dom.phone = document.querySelector(select.cart.phone).value;
  }

  sendOrder() {
    const thisCart = this;

    this.getClientInfo();

    const url = settings.db.url + '/' + settings.db.order;

    const payload = {
      adress: thisCart.dom.address,
      phone: thisCart.dom.phone,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: thisCart.deliveryFee,
      products: [],
    };

    console.log(payload);

    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options);
  }
}

export default Cart;
