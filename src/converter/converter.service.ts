import { ForbiddenException, Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { ConvertJsxDto } from './dto';
import { convert } from './utils/convert';
import { JSDOM } from 'jsdom';

const unwantedTags = ['next-route-announcer', 'style'];

@Injectable()
export class ConverterService {
  private detectTailwind(html: string): boolean {
    const tailwindClassPattern =
      /\b(bg-|text-|p-|m-|w-|h-|flex|grid|block|inline-block|inline-flex|hidden|opacity-|border-|rounded-|shadow-|space-|divide-|gap-|justify-|items-|content-|self-)/;
    const hasTailwindClasses = tailwindClassPattern.test(html);
    const tailwindStylesheetPattern =
      /<link[^>]*href="[^"]*tailwind(?:\.min)?\.css"[^>]*>/;
    const hasTailwindStylesheet = tailwindStylesheetPattern.test(html);
    const inlineTailwindStylePattern = /style="[^"]*(--tw-)[^"]*"/;
    const hasInlineTailwindStyles = inlineTailwindStylePattern.test(html);
    const tailwindJITAttributePattern =
      /<[^>]+(?:\s|:)(data-tw|data-tailwind)[^>]*>/;
    const hasTailwindJITAttributes = tailwindJITAttributePattern.test(html);
    const tailwindJITClassPattern = /\b(tw-)/;
    const hasTailwindJITClasses = tailwindJITClassPattern.test(html);
    return (
      hasTailwindClasses ||
      hasTailwindStylesheet ||
      hasInlineTailwindStyles ||
      hasTailwindJITAttributes ||
      hasTailwindJITClasses
    );
  }

  private detectNextApp(html: string): boolean {
    const nextRootDivPattern = /<div[^>]*id="__next"[^>]*>/;
    const hasNextRootDiv = nextRootDivPattern.test(html);

    const nextAssetPattern = /\/_next\/static\//;
    const hasNextAssetPaths = nextAssetPattern.test(html);

    const nextMetaTagPattern = /<meta[^>]*name="next-head-count"[^>]*>/;
    const hasNextMetaTag = nextMetaTagPattern.test(html);

    const nextScriptPattern = /<script[^>]*src="[^"]*\/_next\/[^"]*"[^>]*>/;
    const hasNextScript = nextScriptPattern.test(html);

    const nextLinkPattern = /<link[^>]*href="[^"]*\/_next\/[^"]*"[^>]*>/;
    const hasNextLink = nextLinkPattern.test(html);

    return (
      hasNextRootDiv ||
      hasNextAssetPaths ||
      hasNextMetaTag ||
      hasNextScript ||
      hasNextLink
    );
  }

  async convertUrl(dto: ConvertJsxDto): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(dto.url, {
      waitUntil: 'networkidle2',
    });
    const pageContent = await page.content();

    const isUsingTailwind = this.detectTailwind(pageContent);
    const isNextApp = this.detectNextApp(pageContent);

    if (!isNextApp) {
      throw new ForbiddenException('The page is not a Next.js app');
    }

    if (!isUsingTailwind) {
      throw new ForbiddenException('The page does not use Tailwind CSS');
    }

    const dom = new JSDOM(pageContent);
    const document = dom.window.document;

    unwantedTags.forEach((tag) => {
      const elements = document.querySelectorAll(tag);
      elements.forEach((element) => element.remove());
    });

    const convertedPagecontent = convert(document.body.innerHTML);
    await browser.close();

    return convertedPagecontent;
  }
}
