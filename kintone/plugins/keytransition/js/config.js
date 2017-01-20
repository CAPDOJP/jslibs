/*
*--------------------------------------------------------------------
* jQuery-Plugin "keytransition -config.js-"
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
        var config=[];
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
})(jQuery,kintone.$PLUGIN_ID);