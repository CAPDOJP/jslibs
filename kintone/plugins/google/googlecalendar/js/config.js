/*
*--------------------------------------------------------------------
* jQuery-Plugin "googlecalendar -config.js-"
* Version: 3.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		fieldinfos:{}
	};
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
				}
			});
			return codes;
		},
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
		var sorted=functions.fieldsort(resp.layout);
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			$.each(sorted,function(index){
				if (sorted[index] in resp.properties)
				{
					var fieldinfo=resp.properties[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'DATE':
						case 'DATETIME':
							$('select#start').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#end').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'MULTI_LINE_TEXT':
						case 'RICH_TEXT':
							$('select#description').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							$('select#eventid').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#summary').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#location').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			if (Object.keys(config).length!==0)
			{
				$('select#eventid').val(config['eventid']);
				$('select#summary').val(config['summary']);
				$('select#start').val(config['start']);
				$('select#end').val(config['end']);
				$('select#location').val(config['location']);
				$('select#description').val(config['description']);
				$('input#calendarid').val(config['calendarid']);
				$('input#client_id').val(config['client_id']);
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#eventid').val()=='')
		{
			swal('Error!','イベントIDフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#summary').val()=='')
		{
			swal('Error!','イベントタイトルフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#start').val()=='')
		{
			swal('Error!','イベント開始日時フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#end').val()=='')
		{
			swal('Error!','イベント終了日時フィールドを選択して下さい。','error');
			return;
		}
		if ($('input#calendarid').val()=='')
		{
			swal('Error!','Google カレンダーIDを入力して下さい。','error');
			return;
		}
		if ($('input#client_id').val()=='')
		{
			swal('Error!','Google OAuth クライアントIDを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['eventid']=$('select#eventid').val();
		config['summary']=$('select#summary').val();
		config['start']=$('select#start').val();
		config['end']=$('select#end').val();
		config['location']=$('select#location').val();
		config['description']=$('select#description').val();
		config['calendarid']=$('input#calendarid').val();
		config['client_id']=$('input#client_id').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);