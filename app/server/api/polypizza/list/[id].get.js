const POLY_PIZZA_BASE = 'https://api.poly.pizza/v1.1'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.polypizzaApiKey

  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Poly Pizza API key is not configured on the server.' })
  }

  const listId = getRouterParam(event, 'id')
  if (!listId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing list ID.' })
  }

  const upstream = await fetch(`${POLY_PIZZA_BASE}/list/${encodeURIComponent(listId)}`, {
    headers: {
      'x-auth-token': apiKey,
      accept: 'application/json'
    }
  })

  if (!upstream.ok) {
    throw createError({
      statusCode: upstream.status,
      statusMessage: `Poly Pizza API returned ${upstream.status} for list "${listId}".`
    })
  }

  return upstream.json()
})
