import { Observable } from 'rxjs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin())

const readComments = (url) => {
    return new Observable(async (subscriber) => {
        const browser = await puppeteer.launch({
            headless: true,
        });
        const page = await browser.newPage();
        page.on('console', async (msg) => {
            if (msg.type() === 'log') {
                for (let i = 0; i < msg.args().length; i++) {
                    subscriber.next(await msg.args()[i].jsonValue());
                }
            }
        });
        await page.goto(url);
        const iframeHandle = await page.waitForSelector('iframe#chatframe')
        const iframe = await iframeHandle.contentFrame()
        const chatHandle = await iframe.waitForSelector('#chat')
        const itemsHandle = await chatHandle.waitForSelector('#items')
        itemsHandle.evaluate((e) => {
            const parseComment = (node) => {
                return {
                    timestamp: node?.querySelector('#timestamp')?.innerText,
                    image: node?.querySelector('#author-photo img')?.getAttribute('src'),
                    author: node?.querySelector('#author-name')?.innerText,
                    message: (() => {
                        const container = node?.querySelector('#message')
                        return [...container.childNodes].reduce((message, e) => {
                            if (e.nodeName === 'IMG') {
                                message += e.getAttribute('shared-tooltip-text') ?? ''
                            } else if (e.nodeName === '#text') {
                                message += e.textContent ?? ''
                            }
                            return message
                        }, '')
                    })(),
                    badge: node?.querySelector('#chat-badges img')?.getAttribute('src'),
                    stamps: (() => {
                        const imgs = [...node?.querySelector('#message')?.querySelectorAll('img') ?? []]
                        return imgs.reduce((stamps, img) => {
                            const key = img.getAttribute('shared-tooltip-text')
                            stamps[key] = img.getAttribute('src')
                            return stamps;
                        }, {})
                    })(),
                }
            }

            if (e.hasChildNodes()) {
                e.querySelectorAll('yt-live-chat-text-message-renderer').forEach(node => {
                    console.log(parseComment(node));
                })
            }
            
            const options = {
                childList: true,
            }
            const callback = (mutationsList, _) => {
                for(const mutation of mutationsList) {
                    mutation.addedNodes.forEach(node => {
                        console.log(parseComment(node));
                    })
                }
            }
            const obs = new MutationObserver(callback);
            obs.observe(e, options);
        })
    });
}

export default readComments;