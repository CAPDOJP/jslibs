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
		excludes:[
			'CALC',
			'CATEGORY',
			'CREATED_TIME',
			'CREATOR',
			'FILE',
			'GROUP_SELECT',
			'MODIFIER',
			'ORGANIZATION_SELECT',
			'RECORD_NUMBER',
			'RICH_TEXT',
			'STATUS',
			'STATUS_ASSIGNEE',
			'SUBTABLE',
			'UPDATED_TIME',
			'USER_SELECT'
		]
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
	    /* key events */
		$(document).on('keydown','input[type=text],select',function(e){
			var code=e.keyCode||e.which;
			if (code==13)
			{
				var targets=$(this).closest('form').find('button:visible:not(:disabled),,input[type=button]:visible,input[type=text]:visible:not(:disabled),select:visible:not(:disabled),textarea:visible:not(:disabled)');
				var total=targets.length;
				var index=targets.index(this);
				if (e.shiftKey)
				{
					if (index==0) index=total;
					index--;
				}
				else
				{
					index++;
					if (index==total) index=0;
				}
				targets.eq(index).focus();
				return false;
			}
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
