const express = require('express')
const xss = require('xss')
const uuid = require('uuid/v4')
const logger = require('../logger')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

const BookmarkService = require('./bookmark-service')

const sanitizeBookmark = bookmark => ({
	id: bookmark.id,
	title: xss(bookmark.title),
	url: xss(bookmark.url),
	description: xss(bookmark.description),
	rating: bookmark.rating,
})

bookmarkRouter
	.route('/bookmarks')
	.get((req, res, next) => {
		const knexInstance = req.app.get('db')

		BookmarkService.getAllBookmarks(knexInstance)
			.then(bookmarks => {
				res.json(bookmarks.map(sanitizeBookmark))
			})
			.catch(next);
	})
	.post(bodyParser, (req, res, next) => {
		const knexInstance = req.app.get('db')

		const { title, url, description = "", rating = 5 } = req.body;

		if (rating < 0 || rating > 5) {
			logger.error("Rating must be between 0 and 5");
			return res.status(400).send("Rating must be between 0 and 5.");
		}

		const bookmark = {
			title,
			url,
			description,
			rating
		};

		['title', 'url'].forEach(key => {
			if (bookmark[key] == null) {
				return res.status(400).json({
					error: { message: `Missing '${key}' in request body` }
				})
			}
		})

		BookmarkService.insertBookmark(knexInstance, bookmark)
			.then(newBookmark => {
				res
					.status(201)
					.location(`/bookmarks/${newBookmark.id}`)
					.json(sanitizeBookmark(newBookmark));

				logger.info(`Bookmark with id ${newBookmark.id} created`);
			})
			.catch(next);
	})

bookmarkRouter.route('/bookmarks/:id')
	.all((req, res, next) => {
		BookmarkService.getById(
			req.app.get('db'),
			req.params.id
		)
			.then(bookmark => {
				if (!bookmark) {
					return res.status(404).json({
						error: { message: `Bookmark doesn't exist` }
					})
				}
				res.bookmark = bookmark // save the article for the next middleware
				next() // don't forget to call next so the next middleware happens!
			})
			.catch(next)
	})
	.get((req, res, next) => {
		const knexInstance = req.app.get('db')

		const { id } = req.params;


		BookmarkService.getById(knexInstance, id)
			.then(bookmark => {
				if (!bookmark) {
					logger.error(`Bookmark with id ${id} not found.`);
					return res
						.status(404)
						.send('Bookmark Not Found');
				}

				res.json(sanitizeBookmark(bookmark))
			})
			.catch(next);
	})
	.delete((req, res, next) => {
		const knexInstance = req.app.get('db')

		const { id } = req.params;

		BookmarkService.deleteBookmark(knexInstance, id)
			.then(() => {
				res.status(204).end();
			})
			.catch(next);
	})

module.exports = bookmarkRouter
