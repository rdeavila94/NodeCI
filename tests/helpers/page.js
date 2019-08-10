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
    await this.page.goto("http://localhost:3000/blogs");
    await this.page.waitFor('a[href="/auth/logout"]'); //This is a caveat, and is exclusive to browsers rendering slower than this test can run
  }

  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
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

  get(path) {
    //We have to pass 'path' as an argument to the callback function because the closure will literally attempt to use 'path' otherwise, which isn't defined to it
    //in other words, the callback is transformed into a string, and said string into javascript, where 'path' doesn't mean anything to it. The outer scope is not
    //known to it
    return this.page.evaluate(_path => {
      return fetch(_path, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        }
      }).then(res => res.json());
    }, path);
  }

  post(path, data) {
    return this.page.evaluate(
      (_path, _data) => {
        //remember that the fetch library returns a promise. Puppeteers .evaluate function
        // automatically waits for a promise to resolve, so we don't have to incorporate our own 'async'
        return fetch(_path, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(_data)
        }).then(res => res.json());
      },
      path,
      data
    );
  }

  execRequest(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      })
    );
  }
}

module.exports = CustomPage;
