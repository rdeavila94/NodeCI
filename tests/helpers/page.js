const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class CustomPage {
  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });
    await this.page.goto("localhost:3000/blogs");
    await this.page.waitFor('a[href="/auth/logout"]'); //This is a caveat, and is exclusive to browsers rendering slower than this test can run
  }

  static async build() {
    const browser = await puppeteer.launch({
      headless: false
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(page, {
      get: function(page, property) {
        if (property === "close") {
          return browser[property];
        }
        return customPage[property] || page[property] || browser[property]; //the reason the customPage is coming first is in case CustomPage overrides functioanlity
      }
    });
  }
}

module.exports = CustomPage;
