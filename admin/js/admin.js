/*
 * Admin.js
 * Fabien Sa 2013
 */

// Load editor (CodeMirror)
var editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
	lineWrapping: true,
	mode: "markdown",
	viewportMargin: Infinity
});


var getPage = function(pagePath, callback) {
	if(pagePath === '') {
		return;
	}
	$.getJSON('../_api/pages/' + pagePath, function(data) {
		callback(data);
	})
}

var deletePage = function(pagePath, callback) {
	$.ajax({
		type: "DELETE",
		url: '../_api/pages/' + pagePath
	})
	.done(function( msg ) {
		callback(msg, false);
	})
	.fail(function( msg ) {
		callback(msg, true);
	});
}

var onHashChange = function() {
	var url = window.location.hash.substr(1);

	if(url !== '') {
		pageTitleEl.val(url).removeClass('notice');
		getPage(url, function(page) {
			editor.setValue(page.content || '');
			setPageInfo(page);
			refreshPreview();
		});
	} else {
		// New page
		editor.setValue('');
		refreshPreview();
		setPageInfo({});
		pageTitleEl.val('').focus();
	}
}

var setPageInfo = function(page) {
	var ulEl = pageInfoEl.find("#infos");

	ulEl.html(''); // Clean previous fields

	for(field in page) {
		if(page.hasOwnProperty(field) && field !== "content" && field !== "url") {
			if(page[field] !== null) {

				if(field === "title") {
					pageTitleEl.val(page.title);
				} else {
					ulEl.append(
						'<li><label class="field">' + field + '</label> <input class="input-m" value="' + page[field] + '" /> <button class="admin-btn-s delete">x</button></li>');
				}

			}
		}
	}
}

var refreshPreview = function() {
	var content = editor.getValue();
	previewEl.html(marked(content));
}

var savePage = function(page, pagePath, callback) {
	$.ajax({
		type: "PUT",
		url: '../_api/pages/' + pagePath,
		data: page
	})
	.done(function(msg) {
		window.location.hash = '#' + pagePath;
		callback(msg, false);
	})
	.fail(function(msg) {
		callback(msg, true);
	});
}

var toggleClassEffect = function(el, className, time) {
	el.addClass(className).delay(time).queue(function(next) {
		$(this).removeClass(className);
		next();
	});
}

function stripHtml(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

$(function() {

	// Main elements
	previewEl = $('#preview .inner');
	listPagesEl = $('#pages-list');
	pageInfoEl = $('#page-info');
	headbarEl = $('#headbar');
	pageTitleEl = headbarEl.find('.title');

	$(window).on('hashchange', onHashChange);
	onHashChange();


	editor.on('keyup', function() {
		refreshPreview();
	});


	// Hide pages list on focus
	editor.on('focus', function() {
		$(".toggleList").removeClass("active").find(".anim").removeClass("rotate");
		listPagesEl.animate({ left: -300 });
	});


	// Pages list panel
	$(".toggleList").on('click', function(e) {
		listPagesEl.clearQueue().stop();
		if($(this).hasClass("active")) {
			$(this).removeClass("active").find(".anim").removeClass("rotate");
			listPagesEl.animate({ left: -300 });
		} else {
			$(this).addClass("active").find(".anim").addClass("rotate");
			listPagesEl.animate({ left: 0 });
		}
	});
	listPagesEl.css({ left: -300 });


	// Pages list panel
	$(".toggleInfo").on('click', function(e) {
		pageInfoEl.clearQueue().stop();
		if($(this).hasClass("active")) {
			$(this).removeClass("active").find(".anim").removeClass("rotate");
			pageInfoEl.animate({ top: -320 });
		} else {
			$(this).addClass("active").find(".anim").addClass("rotate");
			pageInfoEl.animate({ top: 0 });
		}
	});
	pageInfoEl.css({ 'top': -320 });


	// Save page
	$(".save").on('click', function() {
		var page = {};
		page.content = editor.getValue();
		page.title = pageTitleEl.val();

		pageInfoEl.find("ul#infos li").each(function(a, li) {
			var curr = $(this);
			var key = curr.find(".field").html();
			var val = curr.find("input").val();

			page[key] = val;
		});

		var url = window.location.hash.substr(1);

		var isNewPage = false;
		if(url === '') {
			// Sanitize filename
			url = page.title.replace(/[^a-z0-9_\-\[\]\(\)!\'~\|\+=&,]/gi, '_').toLowerCase();
			isNewPage = true;
		}

		savePage(page, url, function(msg, err) {
			if(err || msg === "false" || msg === '') {
				toggleClassEffect(headbarEl, 'error', 1000);
				console.log("Error: " + msg);
			} else {
				toggleClassEffect(headbarEl, 'ok', 1000);
				console.log(msg);

				if(isNewPage) {
					// pages-list
					listPagesEl.find("ul.list").append(
						'<li><a href="#'+url+'">'+url+'</a> <button class="admin-btn-s delete">x</button></li>');
				}
			}
		});
	});


	// Logout
	$(".logout").on('click', function() {
		$.get('../_api/logout', function() {
			location.reload();
		})
	});


	// Delete field
	$("#page-info").on('click', ".delete", function() {
		console.log($(this).parent().html());
		if (confirm('Delete this field ?')) {
			$(this).parent().remove();
		}
	});


	// Add new field
	$("#page-info").on('click', ".plus", function() {
		var field = $(this).parent().find("input");
		$("#infos").append('<li><label class="field">' + field.val() + '</label> <input class="input-m" /> <button class="admin-btn-s delete">x</button></li>');
		field.val("");
	});


	// Delete pages
	listPagesEl.on('click', ".delete", function() {
		var li = $(this).parent();
		var pageName = $(this).parent().find('a').html();

		if (confirm('Delete page "' + pageName + '" ?')) {
			deletePage(pageName, function(msg, err) {
				if(err || msg === "false" || msg === '') {
					toggleClassEffect(headbarEl, 'error', 1000);
					console.log("Error: " + msg);
				} else {
					toggleClassEffect(headbarEl, 'ok', 1000);
					li.remove(); // Remove element from list
				}
			});
		}
	});


	pageTitleEl.on('keyup | blur', function(e) {
		var title = stripHtml(pageTitleEl.val());
		if(title === '') {
			pageTitleEl.addClass('notice');
		} else {
			pageTitleEl.removeClass('notice');
		}
	});

});


marked.InlineLexer.prototype.outputLink = function(cap, link) {
	var patt = /^(https?|ftp):\/\//;
	if(!patt.test(link.href)) {
		link.href = baseUrl + '/data/images/' + link.href;
	}

	if (cap[0].charAt(0) !== '!') {
		return '<a href="'
			+ escape(link.href)
			+ '"'
			+ (link.title
			? ' title="'
			+ escape(link.title)
			+ '"'
			: '')
			+ '>'
			+ this.output(cap[1])
			+ '</a>';
	} else {
		return '<img src="'
			+ (link.href) // escape(link.href)
			+ '" alt="'
			+ escape(cap[1])
			+ '"'
			+ (link.title
			? ' title="'
			+ escape(link.title)
			+ '"'
			: '')
			+ '>';
	}
};

