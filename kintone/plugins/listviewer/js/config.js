/*
*--------------------------------------------------------------------
* jQuery-Plugin "listviewer -config.js-"
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
	var vars={
		template:null
	};
	var functions={
		addexclude:function(){
			$('div.block').first().append(vars.template.clone(true));
			$('div.block').first().find('div.listviewer').last().find('button#removeexclude').show();
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.views,function(key,values){
			$('select#excludeviews').append($('<option>').attr('value',values.id).text(key));
		});
		/* buttons action */
		$('button#addexclude').on('click',function(){
			functions.addexclude();
		});
		$('button#removeexclude').on('click',function(){
			$(this).closest('div.listviewer').remove();
		});
		/* initialize valiable */
		vars.template=$('div.listviewer').clone(true);
		/* setup config */
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (Object.keys(config).length!==0)
		{
			var excludeviews=config['excludeviews'].split(',');
			$.each(excludeviews,function(index){
				/* check row count */
				if ($('div.block').first().find('div.listviewer').length-1<index) functions.addexclude();
				/* setup values */
				var container=$('div.block').first().find('div.listviewer').eq(index);
				$('select#excludeviews',container).val(excludeviews[index]);
			});
		}
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var config=[];
		var excludeviews=[];
		$.each($('div.block').first().find('div.listviewer'),function(index){
			if ($('select#excludeviews',$(this)).val()!='') excludeviews.push($('select#excludeviews',$(this)).val());
		});
		/* setup config */
		config['excludeviews']=excludeviews.join(',')
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);