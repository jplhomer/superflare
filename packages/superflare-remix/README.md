# @superflare/remix

This package provides a wrapper around Superflare worker entrypoints to make handling requests more elegant.

Sadly, it doesn't work right now due to how we have a singleton App container. We need AsyncLocalStorage to fix this. :sob:
