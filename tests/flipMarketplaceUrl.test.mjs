import assert from 'node:assert/strict'
import test from 'node:test'
import { getPlatformUrl } from '../utils/flipMarketplaceUrl.ts'

test('new marketplace offers preserve their canonical stored URLs', () => {
  for (const [platform, url] of [
    ['OLX', 'https://www.olx.pl/d/oferta/phone-IDabc.html'],
    ['Gumtree', 'https://www.gumtree.com/p/phones/phone/123'],
    ['Wallapop', 'https://es.wallapop.com/item/phone-123'],
    ['Blocket', 'https://www.blocket.se/recommerce/forsale/item/123'],
    ['ParuVendu', 'https://www.paruvendu.fr/annonces/high-tech/phone/123A1.htm'],
  ]) assert.equal(getPlatformUrl(platform, '123', url), url)
})

test('ID-only references use known numeric routes or have no link', () => {
  assert.equal(getPlatformUrl('Gumtree', '123'), 'https://www.gumtree.com/p/redirect/redirect/123')
  assert.equal(getPlatformUrl('Blocket', '123'), 'https://www.blocket.se/recommerce/forsale/item/123')
  for (const platform of ['OLX', 'Wallapop', 'ParuVendu', undefined]) {
    assert.equal(getPlatformUrl(platform, '123'), null)
  }
  for (const platform of ['Gumtree', 'Blocket']) {
    for (const id of ['', '../123', '123?foo=bar', '123/456']) assert.equal(getPlatformUrl(platform, id), null)
  }
  assert.equal(getPlatformUrl('Ebay', undefined), null)
})

test('unsafe canonical URLs never become outgoing links', () => {
  for (const url of ['http://www.olx.pl/d/oferta/phone-IDabc.html', 'https://www.olx.pl.evil.test/123',
    'https://user:pass@www.olx.pl/123', 'https://www.olx.pl:8443/123', 'javascript:alert(1)']) {
    assert.equal(getPlatformUrl('OLX', 'IDabc', url), null)
  }
})

test('existing path IDs and marketplace routes remain usable', () => {
  assert.equal(getPlatformUrl('Marktplaats', '/v/phones/iphone/m123-phone'), 'https://www.marktplaats.nl/v/phones/iphone/m123-phone')
  assert.equal(getPlatformUrl('Marktplaats', 'm123'), 'https://www.marktplaats.nl/v/redirect/redirect/m123-test')
  assert.equal(getPlatformUrl('Willhaben', '/kaufen-und-verkaufen/d/phone-123'), 'https://www.willhaben.at/iad/kaufen-und-verkaufen/d/phone-123')
  assert.equal(getPlatformUrl('Ebay', '123'), 'https://ebay.de/itm/123')
})
