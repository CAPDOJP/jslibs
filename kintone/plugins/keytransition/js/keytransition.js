/*
*--------------------------------------------------------------------
* jQuery-Plugin "keytransition"
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
		controls:'a:visible:not(:disabled),button:visible:not(:disabled),input[type=button]:visible:not(:disabled),input[type=text]:visible:not(:disabled),select:visible:not(:disabled),textarea:visible:not(:disabled)',
		dialogs:null
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!config) return false;
		/* initialize valiable */
		vars.dialogs=$('body').children('div[class*=dialog]');
	    /* view events */
	    vars.dialogs.on('inview',function(){$(this).find(vars.controls).first().focus();});
	    /* key events */
		$(document).on('keydown','a,button,input[type=button],input[type=text],select',function(e){
			var code=e.keyCode||e.which;
			var direction='';
			if (code==13 && ($(this).prop('tagName').toLowerCase()!='button' && $(this).prop('tagName').toLowerCase()!='a' && $(this).prop('tagName').toLowerCase()!='input[type=button]')) direction=(e.shiftKey)?'prev':'next';
			if (code==38 && $(this).prop('tagName').toLowerCase()!='select') direction='prev';
			if (code==40 && $(this).prop('tagName').toLowerCase()!='select') direction='next';
			if (direction.length!=0)
			{
				var range=$(this).parents('div').last();
				var targets=null;
				if (!range.is('div[class*=dialog]')) range=$('body');
				targets=range.find(vars.controls);
				var total=targets.length;
				var index=targets.index(this);
				switch (direction)
				{
					case 'prev':
						if (index==0) index=total;
						index--;
						break;
					case 'next':
						index++;
						if (index==total) index=0;
						break;
				}
				targets.eq(index).focus();
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
