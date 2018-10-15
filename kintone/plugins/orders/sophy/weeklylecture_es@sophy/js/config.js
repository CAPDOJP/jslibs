/*
*--------------------------------------------------------------------
* jQuery-Plugin "weeklylecture -config.js-"
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
		offset:0,
		viewtable:null,
	};
	var functions={
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				/* setup app lists */
				$.each(resp.apps,function(index,values){
					if (values.appId!=kintone.app.getId()) $('select#templateapp').append($('<option>').attr('value',values.appId).text(values.name));
				})
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else
				{
					if (callback!=null) callback();
				}
			},function(error){});
		},
		reloadapp:function(callback){
			$('select[id^=template]:not(#templateapp)').empty();
			$('select[id^=template]:not(#templateapp)').append($('<option>').attr('value','').text(''));
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:$('select#templateapp').val()},function(resp){
				$.each(resp.properties,function(key,values){
					/* check field type */
					switch (values.type)
					{
						case 'SINGLE_LINE_TEXT':
							$('select#templatesubject').append($('<option>').attr('value',values.code).text(values.label));
							break;
						case 'MULTI_LINE_TEXT':
						case 'RICH_TEXT':
							$('select#templatebody').append($('<option>').attr('value',values.code).text(values.label));
							break;
					}
				});
				if (callback!=null) callback();
			});
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.views,function(key,values){
			$('select#view').append($('<option>').attr('value',values.id).text(key));
		});
		functions.loadapps(function(){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			/* initialize valiable */
			vars.viewtable=$('.views').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var row=null;
			var views=[];
			if (Object.keys(config).length!==0)
			{
				views=JSON.parse(config['view']);
				$('select#templateapp').val(config['templateapp']);
				for (var i=0;i<views.length;i++)
				{
					if (add) vars.viewtable.addrow();
					else add=true;
					row=vars.viewtable.rows.last();
					$('select#view',row).val(views[i]);
				}
				functions.reloadapp(function(){
					$('select#templatesubject').val(config['templatesubject']);
					$('select#templatebody').val(config['templatebody']);
				});
			}
			/* events */
			$('select#templateapp').on('change',function(){functions.reloadapp(null)});
		});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var views=[];
		/* check values */
		for (var i=0;i<vars.viewtable.rows.length;i++)
		{
			row=vars.viewtable.rows.eq(i);
			if ($('select#view',row).val().length!=0) views.push($('select#view',row).val());
		}
		if ($('select#templateapp').val()=='')
		{
			swal('Error!','テンプレートアプリを選択して下さい。','error');
			return;
		}
		if ($('select#templatesubject').val()=='')
		{
			swal('Error!','テンプレート件名を選択して下さい。','error');
			return;
		}
		if ($('select#templatebody').val()=='')
		{
			swal('Error!','テンプレート本文を選択して下さい。','error');
			return;
		}
		/* setup config */
		config['templateapp']=$('select#templateapp').val();
		config['templatesubject']=$('select#templatesubject').val();
		config['templatebody']=$('select#templatebody').val();
		config['view']=JSON.stringify(views);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);