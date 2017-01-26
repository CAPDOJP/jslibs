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
	 initialize fields
	---------------------------------------------------------------*/
    var config=kintone.plugin.app.getConfig(PLUGIN_ID);
    if (Object.keys(config).length!==0) if (config['passingbuttons']=='1') $('input#passingbuttons').prop('checked',true);
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
        var config=[];
	    /* check values */
        config['passingbuttons']=($('input#passingbuttons').prop('checked'))?'1':'0';
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
    $('button#cancel').on('click',function(e){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);