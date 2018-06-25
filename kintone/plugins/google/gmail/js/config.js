/*
*--------------------------------------------------------------------
* jQuery-Plugin "gmail -config.js-"
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
		}
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
						case 'LINK':
							if (fieldinfo.protocol.toUpperCase()=='MAIL') $('select#mailto').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'MULTI_LINE_TEXT':
						case 'RICH_TEXT':
							$('select#body').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							$('select#subject').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			if (Object.keys(config).length!==0)
			{
				$('select#mailto').val(config['mailto']);
				$('select#subject').val(config['subject']);
				$('select#body').val(config['body']);
				$('input#apikey').val(config['apikey']);
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#mailto').val()=='')
		{
			swal('Error!','送信先メールアドレスフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#subject').val()=='')
		{
			swal('Error!','件名フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#body').val()=='')
		{
			swal('Error!','本文フィールドを選択して下さい。','error');
			return;
		}
		if ($('input#apikey').val()=='')
		{
			swal('Error!','Google Gmail APIキーを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['mailto']=$('select#mailto').val();
		config['subject']=$('select#subject').val();
		config['body']=$('select#body').val();
		config['apikey']=$('input#apikey').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);