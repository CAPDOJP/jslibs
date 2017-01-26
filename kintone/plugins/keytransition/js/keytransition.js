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
		config:{},
		controls:
			'button:visible:not(:disabled),'+
			'input:visible:not(:disabled):not([type=hidden]),'+
			'select:visible:not(:disabled),'+
			'textarea:visible:not(:disabled)',
		controls_passingbuttons:
			'input:visible:not(:disabled):not([type=button]):not([type=file]):not([type=hidden]),'+
			'select:visible:not(:disabled),'+
			'textarea:visible:not(:disabled)',
		dialogs:'div[role=dialog]'
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
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
	    /* dialog shown */
		$('body').on('DOMNodeInserted',vars.dialogs+' table tbody tr',function(e){
			if ($(e.target).parent().find('tr').length==1) $(e.target).find(vars.controls).first().focus();
		});
	    /* key events */
		$(document).on('keydown','button,input:not([type=hidden]),select',function(e){
			var code=e.keyCode||e.which;
			var direction='';
			if (code==13)
			{
				/* cheking passing buttons */
				if (vars.config['passingbuttons']=='1' && $(this).is('button')) return;
				if (vars.config['passingbuttons']=='1' && $(this).is('input[type=button]')) return;
				if (vars.config['passingbuttons']=='1' && $(this).is('input[type=file]')) return;
				direction=(e.shiftKey)?'prev':'next';
			}
			if (code==38 && !$(this).is('select')) direction='prev';
			if (code==40 && !$(this).is('select')) direction='next';
			if (direction.length!=0)
			{
				var range=$(this).parents('div').last();
				var targets=null;
				if (!range.is(vars.dialogs)) range=$('body');
				/* cheking passing buttons */
				if (code==13 && vars.config['passingbuttons']=='1') targets=range.find(vars.controls_passingbuttons);
				else targets=range.find(vars.controls);
				var total=targets.length;
				var index=targets.index(this);
				/* move to next controls */
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
