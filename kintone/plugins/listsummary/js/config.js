/*
*--------------------------------------------------------------------
* jQuery-Plugin "listsummary -config.js-"
* Version: 3.0
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
	if (Object.keys(config).length!==0)
	{
		$('select#round').val(config['round']);
		$('input#digit').val(config['digit']);
		if (config['total']=='1') $('input#total').prop('checked',true);
		if (config['average']=='1') $('input#average').prop('checked',true);
		if (config['max']=='1') $('input#max').prop('checked',true);
		if (config['min']=='1') $('input#min').prop('checked',true);
		if (config['all']=='1') $('input#all').prop('checked',true);
	}
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var checked=false;
		/* check values */
		if ($('input#total').prop('checked')) checked=true;
		if ($('input#average').prop('checked')) checked=true;
		if ($('input#max').prop('checked')) checked=true;
		if ($('input#min').prop('checked')) checked=true;
		if (!checked)
		{
			swal('Error!','集計パターンのいずれかにチェックを付けて下さい。','error');
			return;
		}
		/* setup config */
		config['total']=($('input#total').prop('checked'))?'1':'0';
		config['average']=($('input#average').prop('checked'))?'1':'0';
		config['max']=($('input#max').prop('checked'))?'1':'0';
		config['min']=($('input#min').prop('checked'))?'1':'0';
		config['all']=($('input#all').prop('checked'))?'1':'0';
		config['round']=$('select#round').val();
		config['digit']=(($('input#digit').val().match(/^[0-9]+$/g))?$('input#digit').val():'0');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);