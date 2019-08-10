const Page = require("./helpers/page");

let page;

beforeEach(async () => {
  page = await Page.build();

  await page.goto("http://localhost:3000");
});

afterEach(() => {
  page.close();
});

describe("When logged in", async () => {
  beforeEach(async () => {
    await page.login();
    await page.click('.btn-floating[href="/blogs/new"]');
  });

  test("Can see blog create form", async () => {
    const label = await page.$eval(
      "form label:nth-child(1)",
      el => el.innerText
    );
    expect(label).toEqual("Blog Title");
  });

  describe("And using valid inputs", async () => {
    beforeEach(async () => {
      await page.type('input[name="title"]', "My title");
      await page.type('input[name="content"]', "My content");
      await page.click('button[type="submit"]');
    });

    test("Submitting takes user to review screen", async () => {
      const innerText = await page.$eval("form h5", el => el.innerText);
      expect(innerText).toEqual("Please confirm your entries");
    });

    test("Submitting then saving adds blog to index page", async () => {
      await page.click("button.green");
      await page.waitFor(".card");

      //Because everytime we run a puppeteer test we are creating a new user (the userFactory in page.build()), we can guarantee we'll only have one card-title
      //in a real environment, there will be multiple card-titles
      const title = await page.$eval(".card-title", el => el.innerText);
      const content = await page.$eval("p", el => el.innerText);

      expect(title).toEqual("My title");
      expect(content).toEqual("My content");
    });
  });

  describe("And using invalid inputs", async () => {
    beforeEach(async () => {
      await page.click('button[type="submit"]');
    });

    test("the form shows an error message", async () => {
      const titleText = await page.$eval(
        "div.title div.red-text",
        el => el.innerText
      );
      const contentText = await page.$eval(
        "div.content div.red-text",
        el => el.innerText
      );
      expect(titleText).toEqual("You must provide a value");
      expect(contentText).toEqual("You must provide a value");
    });
  });
});

describe("When not logged in", async () => {
  const actions = [
    {
      method: "get",
      path: "/api/blogs"
    },
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "T",
        content: "C"
      }
    }
  ];

  test("Blog related actions are prohibited", async () => {
    const results = await page.execRequest(actions);
    
    results.forEach(result => expect(result.error).toEqual('You must log in!'))
  });
});
