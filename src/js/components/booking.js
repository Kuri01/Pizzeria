import { classNames, select, settings, templates } from '../settings.js';
import AmountWidget from './amountwidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import { utils } from '../utils.js';

export class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);

    thisBooking.initWidgets();

    thisBooking.getData();

    thisBooking.initListeners();
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);

    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    // console.log('getData params', params);

    const urls = {
      booking:
        settings.db.url +
        '/' +
        settings.db.booking +
        '?' +
        params.booking.join('&'),
      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsRepeat.join('&'),
    };

    // console.log('getData URLS: ', urls);
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];

        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([booking, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(booking, eventsCurrent, eventsRepeat);
        console.log(booking, eventsCurrent, eventsRepeat);
      });
  }

  parseData(booking, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of booking) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
      }
    }
    thisBooking.updateDOM();
    // console.log('thisBookingBooked = ', thisBooking.booked);
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;
    console.log(thisBooking.datePicker.value);
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.table.booked);
        table.classList.remove(classNames.booking.table.picked);
      } else {
        table.classList.remove(classNames.booking.table.booked);
      }
    }
  }

  render(element) {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = [];
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = document.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = element.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );
    thisBooking.dom.orderConfirmation = element.querySelector(
      select.booking.orderConf
    );
    thisBooking.dom.floor = document.querySelector(classNames.booking.floor);
    thisBooking.dom.submit = element.querySelector('[type="submit"]');
    thisBooking.dom.phone = element.querySelector('[name="phone"]');
    thisBooking.dom.address = element.querySelector('[name="address"]');
    thisBooking.pickedTable = {};
    thisBooking.dom.starters = [];
    thisBooking.dom.starters.water = element.querySelector(
      '[name="starter"][value="water"]'
    );
    thisBooking.dom.starters.bread = element.querySelector(
      '[name="starter"][value="bread"]'
    );
  }
  getClientInfo() {
    const thisBooking = this;
    function getStarters() {
      if (
        thisBooking.dom.starters.water.checked &&
        !thisBooking.dom.starters.bread.checked
      ) {
        thisBooking.pickedStarters = ['water'];
      } else if (
        (!thisBooking.dom.starters.water.checked &&
          thisBooking.dom.starters.bread.checked) ||
        (thisBooking.dom.starters.water.checked &&
          thisBooking.dom.starters.bread.checked)
      ) {
        thisBooking.pickedStarters = ['water', 'bread'];
      } else {
        thisBooking.pickedStarters = [];
      }
      console.log('getting info');
    }
    getStarters();

    thisBooking.ppl = thisBooking.dom.peopleAmount.querySelector(
      select.booking.input
    ).value;
    thisBooking.duration = thisBooking.dom.hoursAmount.querySelector(
      select.booking.input
    ).value;
  }
  sendOrder() {
    const thisBooking = this;

    thisBooking.getClientInfo();

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.pickedTable),
      duration: parseInt(thisBooking.duration),
      ppl: parseInt(thisBooking.ppl),
      starters: thisBooking.pickedStarters,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };
    console.log(payload);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options).then(function (response) {
      if (response.ok) {
        thisBooking.makeBooked(
          payload.date,
          payload.hour,
          payload.duration,
          payload.table
        );
        console.log('!OK!');
        thisBooking.updateDOM();
      }
    });
  }

  initWidgets() {
    const thisBooking = this;

    new AmountWidget(thisBooking.dom.hoursAmount);
    new AmountWidget(thisBooking.dom.peopleAmount);

    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
  }

  initListeners() {
    const thisBooking = this;
    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
      for (let table of thisBooking.dom.tables) {
        table.classList.remove(classNames.booking.table.picked);
      }
      thisBooking.pickedTable = null;
    });

    thisBooking.dom.floor.addEventListener('click', function (event) {
      if (
        event.target.classList.contains(classNames.booking.table.table) &&
        !event.target.classList.contains(classNames.booking.table.booked)
      ) {
        const targetId = event.target.getAttribute(
          settings.booking.tableIdAttribute
        );
        for (let table of thisBooking.dom.tables) {
          const tableId = table.getAttribute(settings.booking.tableIdAttribute);
          if (
            tableId !== targetId &&
            table.classList.contains(classNames.booking.table.picked)
          ) {
            table.classList.remove(classNames.booking.table.picked);
          }
        }
        if (!event.target.classList.contains(classNames.booking.table.picked)) {
          event.target.classList.add(classNames.booking.table.picked);
          thisBooking.pickedTable = targetId;
        } else {
          event.target.classList.remove(classNames.booking.table.picked);
          thisBooking.pickedTable = null;
        }
        // console.log(thisBooking.pickedTable);
      }
    });

    thisBooking.dom.submit.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.sendOrder();
      console.log(settings.db.url + '/' + settings.db.booking);
    });
  }
}
