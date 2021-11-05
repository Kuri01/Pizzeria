import { select } from '../settings.js';
import { app } from '../app.js';
export const home = {
  initData: function () {
    const thisHome = this;

    thisHome.dom = {};

    thisHome.dom.buttons = {};

    thisHome.dom.buttons.order = document.querySelector(
      select.home.button.order
    );
    thisHome.dom.buttons.book = document.querySelector(select.home.button.book);
  },

  initActions: function () {
    const thisHome = this;
    thisHome.dom.buttons.order.addEventListener('click', function (event) {
      event.preventDefault();
      const pageId = event.target.getAttribute('value');
      app.activatePage(pageId);
    });

    thisHome.dom.buttons.book.addEventListener('click', function (event) {
      event.preventDefault();
      const pageId = event.target.getAttribute('value');
      app.activatePage(pageId);
    });
  },

  init: function () {
    const thisHome = this;
    console.log(document.querySelector(select.home.button.order));
    thisHome.initData();
    thisHome.initActions();
  },
};
