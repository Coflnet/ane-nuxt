import assert from 'node:assert/strict'
import test from 'node:test'
import { pickDefaultNotification } from '../utils/notifyDefault.ts'

const base = { filters: [], isWebView: false, pushAllowed: false, isLoggedIn: false, savedEmail: '', accountEmail: '', savedDiscordWebhook: '' }

test('the newest existing filter channel wins', () => {
  const filters = [{ id: 3, targetType: 'Email', target: 'old@example.com' }, { id: 9, targetType: 'DiscordWebhook', target: 'https://discord.com/api/webhooks/1/x' }]
  assert.deepEqual(pickDefaultNotification({ ...base, filters, isWebView: true }), { type: 'DiscordWebhook', target: 'https://discord.com/api/webhooks/1/x', derived: true })
})

test('a newest filter without notifications falls through to the next source', () => {
  const filters = [{ id: 9, targetType: 'Unknown' }, { id: 3, targetType: 'Email', target: 'a@example.com' }]
  assert.equal(pickDefaultNotification({ ...base, filters, isWebView: true, pushAllowed: true }).type, 'FireBase')
})

test('push from the newest filter is only reused when it needs no new permission prompt', () => {
  const filters = [{ id: 9, targetType: 'FireBase', target: '-' }]
  assert.equal(pickDefaultNotification({ ...base, filters, pushAllowed: true }).type, 'FireBase')
  assert.equal(pickDefaultNotification({ ...base, filters, isLoggedIn: true, accountEmail: 'a@example.com' }).type, 'Email')
})

test('email needs a signed-in account; the saved address beats the account address', () => {
  assert.deepEqual(pickDefaultNotification({ ...base, isLoggedIn: true, savedEmail: 'saved@example.com', accountEmail: 'acc@example.com' }), { type: 'Email', target: 'saved@example.com', derived: true })
  assert.equal(pickDefaultNotification({ ...base, isLoggedIn: true, accountEmail: 'acc@example.com' }).target, 'acc@example.com')
  assert.equal(pickDefaultNotification({ ...base, isLoggedIn: false, accountEmail: 'acc@example.com' }).type, 'Unknown')
})

test('a saved Discord webhook, otherwise no notification', () => {
  assert.equal(pickDefaultNotification({ ...base, savedDiscordWebhook: 'https://discord.com/api/webhooks/1/x' }).type, 'DiscordWebhook')
  assert.deepEqual(pickDefaultNotification(base), { type: 'Unknown', target: '', derived: false })
})
