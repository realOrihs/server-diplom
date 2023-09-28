import { Strapi } from '@strapi/strapi';

const {Builder,By} = require("selenium-webdriver");
const chrome  = require("selenium-webdriver/chrome")
const siteNameToHostMap = new Map();
siteNameToHostMap.set('steambalance', 'https://steambalance.ru/');
siteNameToHostMap.set('seagm', 'https://www.seagm.com/ru-ru');
siteNameToHostMap.set('icegames', 'https://icegames.store/');
siteNameToHostMap.set('codashop', 'https://www.codashop.com/ru-ru/');

const siteNameToCssMap = new Map();
siteNameToCssMap.set('steambalance', '#root div div.container div header div div:nth-child(1) div div.stats-value');
siteNameToCssMap.set('seagm', '');
siteNameToCssMap.set('icegames', '');
siteNameToCssMap.set('codashop', '');

const sitesWithTransactionsCount = new Set(["steambalance"]);
const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--no-sandbox');
let isStart = false
export default {
    myJob: {
      task: async ({ strapi} : {strapi: Strapi}) => {
        if (isStart) {
          console.log('[CRON]: ALREADY STARTED');
          return
        }
        try {
          isStart = true
          console.log('[CRON]: START PARSER');
          let amount = ''
          for (const  siteName of sitesWithTransactionsCount) {
            if (sitesWithTransactionsCount.has(siteName)) {
              let webdriver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions.headless()).build();
              await webdriver.get(siteNameToHostMap.get(siteName));
              amount = await webdriver.findElement(By.css(siteNameToCssMap.get(siteName))).getText();
              webdriver.quit()
              
              let places = await strapi.db.query('api::place.place').findMany({
                select: ['name', 'id']
              })
              
              const placesFiltered = places.filter(place => place.name === siteName);
              if (placesFiltered.length == 0) {
                throw Error('not found place by name')
              }
              if ('steambalance' === siteName) amount = amount.split(' ').join('')
              await strapi.service('api::place.place').update(placesFiltered[0].id, {data: {
                totalCountTransaction: parseInt(amount),
              }})
              await strapi.service('api::stat.stat').create({
                data: {
                  count_transaction: parseInt(amount),
                  place: placesFiltered[0].id,
                }
              })
          }
          else {
            amount = `Site ${siteName} had no info about transactions count`;
          }
        }
        } catch (error) {
            console.log(error);
        } finally {
          isStart = false
          console.log('[CRON]: END PARSER');
        }
      },
      // only run once after 10 seconds
      options: {
        rule: "*/20 * * * *",
        tz: "Europe/Moscow"
      },
    }
  };
