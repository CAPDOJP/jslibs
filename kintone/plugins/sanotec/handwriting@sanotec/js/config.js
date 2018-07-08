/*
*--------------------------------------------------------------------
* jQuery-Plugin "handwriting -config.js-"
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
		spacer:[],
		offset:0
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
							else vars.spacer.push(values.elementId);
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
		$.each(vars.spacer,function(index){
			$('select#space').append($('<option>').attr('value',vars.spacer[index]).text(vars.spacer[index]));
		});
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
						case 'FILE':
							$('select#file').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* setup config */
			if (Object.keys(config).length!==0)
			{
				$('select#space').val(config['space']);
				$('select#file').val(config['file']);
				$('input#image').val(config['image']);
				$('div.image').append($('<img>').attr('src',$('input#image').val()));
			}
			/* events */
			$('button#delete').on('click',function(e){
				$('input#image').val('');
				$('div.image').empty();
			});
			$('input[type="file"]').on('change',function(e){
				if (e.target.files.length!=0)
				{
					var reader=new FileReader();
					reader.onload=(function(readData){
						$('input#image').val(readData.target.result);
						$('div.image').append($('<img>').attr('src',readData.target.result));
					});
					reader.readAsDataURL(e.target.files[0]);
				}
				else
				{
					$('input#image').val('');
					$('div.image').empty();
				}
			})
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		/* check values */
		if ($('select#space').val()=='')
		{
			swal('Error!','署名フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#file').val()=='')
		{
			swal('Error!','添付ファイルフィールドを選択して下さい。','error');
			return;
		}
		if ($('input#image').val()=='')
		{
			swal('Error!','透かし画像を選択して下さい。','error');
			return;
		}
		/* setup config */
		config['space']=$('select#space').val();
		config['file']=$('select#file').val();
		config['image']=$('input#image').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);