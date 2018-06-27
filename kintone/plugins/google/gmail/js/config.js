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
		},
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
			$('select#templatename').empty().append($('<option>').attr('value','').text(''));
			$('select#templatesubject').empty().append($('<option>').attr('value','').text(''));
			$('select#templatebody').empty().append($('<option>').attr('value','').text(''));
			if ($('select#templateapp').val())
			{
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:$('select#templateapp').val()},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:$('select#templateapp').val()},function(resp){
						$.each(sorted,function(index){
							if (sorted[index] in resp.properties)
							{
								var fieldinfo=resp.properties[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'SINGLE_LINE_TEXT':
										$('select#templatename').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										$('select#templatesubject').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
									case 'MULTI_LINE_TEXT':
									case 'RICH_TEXT':
										$('select#templatebody').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
										break;
								}
							}
						});
						if (callback!=null) callback();
					},function(error){});
				},function(error){});
			}
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
		var sorted=functions.fieldsort(resp.layout);
		$.each(vars.spacer,function(index){
			$('select#histories').append($('<option>').attr('value',vars.spacer[index]).text(vars.spacer[index]));
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
							$('select#attachment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'LINK':
							if (fieldinfo.protocol.toUpperCase()=='MAIL')
							{
								$('select#mailto').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#mailcc').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#mailbcc').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
					}
				}
			});
			/* initialize valiable */
			functions.loadapps(function(){
				/* setup config */
				if (Object.keys(config).length!==0)
				{
					$('select#mailto').val(config['mailto']);
					$('select#mailcc').val(config['mailcc']);
					$('select#mailbcc').val(config['mailbcc']);
					$('select#attachment').val(config['attachment']);
					$('select#templateapp').val(config['templateapp']);
					$('select#histories').val(config['histories']);
					$('input#client_id').val(config['client_id']);
					if (config['draft']=='1') $('input#draft').prop('checked',true);
					functions.reloadapp(function(){
						$('select#templatename').val(config['templatename']);
						$('select#templatesubject').val(config['templatesubject']);
						$('select#templatebody').val(config['templatebody']);
					});
				}
				else functions.reloadapp();
				/* events */
				$('select#templateapp').on('change',function(){functions.reloadapp()});
			});
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
			swal('Error!','送信先(To)フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailto').val()==$('select#mailcc').val())
		{
			swal('Error!','送信先(To)フィールドと送信先(CC)フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#mailto').val()==$('select#mailbcc').val())
		{
			swal('Error!','送信先(To)フィールドと送信先(BCC)フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		if ($('select#templateapp').val()=='')
		{
			swal('Error!','テンプレートアプリを選択して下さい。','error');
			return;
		}
		if ($('select#templatename').val()=='')
		{
			swal('Error!','テンプレート名フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#templatesubject').val()=='')
		{
			swal('Error!','テンプレート件名フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#templatebody').val()=='')
		{
			swal('Error!','テンプレート本文フィールドを選択して下さい。','error');
			return;
		}
		if ($('input#client_id').val()=='')
		{
			swal('Error!','Google OAuth クライアントIDを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['mailto']=$('select#mailto').val();
		config['mailcc']=$('select#mailcc').val();
		config['mailbcc']=$('select#mailbcc').val();
		config['attachment']=$('select#attachment').val();
		config['templateapp']=$('select#templateapp').val();
		config['templatename']=$('select#templatename').val();
		config['templatesubject']=$('select#templatesubject').val();
		config['templatebody']=$('select#templatebody').val();
		config['histories']=$('select#histories').val();
		config['client_id']=$('input#client_id').val();
		config['draft']=($('input#draft').prop('checked'))?'1':'0';
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);