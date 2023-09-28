const {Builder,By} = require("selenium-webdriver");
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

const sitesWithTransactionsCount = new Set(["steambalance", "icegames"]);
export default {
    async transactionsCount(ctx, next) {
        let siteName = ctx.request.query.siteName;
        console.log(ctx.request.query);

        if (sitesWithTransactionsCount.has(siteName)) {
            let webdriver = await new Builder().forBrowser('chrome').build();
            await webdriver.get(siteNameToHostMap.get(siteName));
            ctx.response.body = await webdriver.findElement(By.css(siteNameToCssMap.get(siteName))).getText();
        }
        else {
            ctx.response.body = `Site ${siteName} had no info about transactions count`;
        }
    }
};