const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

const BookmarkService = require('./bookmark-service')

bookmarkRouter
	.route('/bookmarks')
	.get((req, res, next) => {
		const knexInstance = req.app.get('db')

		BookmarkService.getAllBookmarks(knexInstance)
		.then(bookmarks => {
			res.json(bookmarks)
		})
		.catch(next);
	})
	.post(bodyParser, (req, res, next) => {
		const knexInstance = req.app.get('db')

		const { title, url, description = "", rating = 5 } = req.body;

		if (!title) {
			logger.error("Title is required");
			return res.status(400).send("Invalid data");
		}
		if (!url) {
			logger.error("URL is required");
			return res.status(400).send("Invalid data");
		}

		const bookmark = {
			title,
			url,
			description,
			rating
		};

		BookmarkService.insertBookmark(knexInstance, bookmark)
		.then(newBookmark => {
			res
			.status(201)
			.location(`http://localhost:8000/bookmark/${newBookmark.id}`)
			.json(bookmark);

			logger.info(`Bookmark with id ${newBookmark.id} created`);
		})
		.catch(next);
	})

bookmarkRouter
	.route('/bookmarks/:id')
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

			res.json(bookmark)
		})
		.catch(next);
	})
	.delete((req, res, next) => {
		const knexInstance = req.app.get('db')

		const { id } = req.params;

		BookmarkService.deleteBookmark(knexInstance, id)
		.then(result => {
			if (!result) {
				logger.error(`Bookmark with id ${id} not found.`);
				return res
					.status(404)
					.send('Not found');
			}

			logger.info(`Bookmark with id ${id} deleted.`);

			res.status(204).end();
		})
		.catch(next);
	})

module.exports = bookmarkRouter
