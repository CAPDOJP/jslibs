	/*
*--------------------------------------------------------------------
* jQuery-Plugin "pdfviewer"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		config:{},
		viewer:null
	};
	var events={
		show:[
			'app.record.detail.show',
			'app.record.index.show'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
	    /* create viewer */
		var cover=$('<div>').css({
			'background-color':'rgba(0,0,0,0.5)',
			'box-sizing':'border-box',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'position':'fixed',
			'top':'0px',
			'width':'100%',
			'z-index':'999999'
		});
		var container=$('<div>').css({
			'background-color':'#FFFFFF',
			'bottom':'0',
			'border-radius':'0.5em',
			'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
			'box-sizing':'border-box',
			'height':'calc(100% - 2em)',
			'left':'0',
			'margin':'auto',
			'padding':'3em 0.5em 0.5em 0.5em',
			'position':'absolute',
			'right':'0',
			'top':'0',
			'width':'calc(100% - 2em)'
		});
		var contents=$('<iframe>').css({
			'border':'none',
			'box-sizing':'border-box',
			'height':'100%',
			'margin':'0px',
			'padding':'0px',
			'position':'relative',
			'width':'100%',
			'z-index':'111'
		});
		var close=$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png">').css({
			'box-sizing':'border-box',
			'coursor':'pointer',
			'height':'2em',
			'margin':'0px',
			'padding':'0px',
			'position':'absolute',
			'right':'0.5em',
			'top':'0.5em',
			'width':'2em',
			'z-index':'111'
		})
		.on('click',function(){cover.hide();});
		cover.append(container
			.append(contents)
			.append(close)
		)
		$('body').append(cover);
		$(document).on('mousedown','a',function(e){
			if ($(this).attr('href').match(/\.pdf$/g))
			{
				contents.attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/pdfviewer/web/viewer.html?file='+$(this).attr('href')+'&zoom=page-fit');
				cover.show();
				e.stopPropagation();
				e.preventDefault();
			}
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
