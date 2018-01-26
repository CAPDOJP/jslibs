/*
*--------------------------------------------------------------------
* jQuery-Plugin "checklist"
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
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		answers:[
			'CHECK_BOX',
			'DATE',
			'DROP_DOWN',
			'MULTI_SELECT',
			'NUMBER',
			'RADIO_BUTTON',
			'SINGLE_LINE_TEXT'
		],
		checklist:[],
		container:null,
		table:null,
		header:null,
		rows:null,
		template:null,
		config:{},
		fieldinfos:{},
		drag:{
			capture:false,
			cells:[],
			keep:{
				column:0,
				container:0,
				position:0
			}
		},
		containers:[],
		layout:[]
	};
	var events={
		show:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* download nss file */
		download:function(){
			var downloadvalue='';
			$.each($('tr',vars.rows),function(index){downloadvalue+=$('td',$(this)).first().text()+'\n';});
			$.downloadtext(downloadvalue,'SJIS','checklistlabel.txt');
		},
		/* upload nss records */
		upload:function(){
			var error=false;
			var counter=0;
			var target=$('.file');
			var checkvalues=[];
			if (target[0].files.length==0) return;
			$.uploadtext(target[0].files[0],'UNICODE',function(records){
				var labelindex=-1;
				records=records.split('\n');
				for (var i=0;i<records.length;i++)
				{
					if (records[i].length==0) continue;
					$.each(vars.layout,function(index,values){
						if (labelindex<index)
						{
							switch (values.type)
							{
								case 'ROW':
									if (values.fields.length==2)
										if (values.fields[0].type=="LABEL" && $.inArray(values.fields[1].type,vars.answers)>-1)
										{
											values.fields[0].label=records[i].replace(/^"/g,'').replace(/"$/g,'');
											labelindex=index;
											return false;
										}
									break;
							}
						}
					});
				}
				/* put layout */
				kintone.api(kintone.api.url('/k/v1/preview/app/form/layout',true),'PUT',{app:kintone.app.getId(),layout:vars.layout},function(resp){
					kintone.api(kintone.api.url('/k/v1/preview/app/deploy',true),'POST',{apps:[{app:kintone.app.getId()}]},function(resp){
						var waitprocess=function(){
							setTimeout(function(){
								kintone.api(kintone.api.url('/k/v1/preview/app/deploy',true),'GET',{apps:[kintone.app.getId()]},function(resp){
									switch (resp.apps[0].status)
									{
										case 'PROCESSING':
											waitprocess();
											break;
										case 'SUCCESS':
											functions.hideloading();
											swal({
												title:'登録完了',
												text:'登録しました。',
												type:'success'
											},function(){
												location.reload(true);
											});
											break;
										case 'FAIL':
											functions.hideloading();
											my.hide();
											swal('Error!','ラベルの更新に失敗しました。\nアプリの設定画面を開いてエラー内容を確認して下さい。','error');
											break;
										case 'CANCEL':
											functions.hideloading();
											my.hide();
											swal('Error!','ラベルの更新がキャンセルされました。','error');
											break;
									}
								},
								function(error){
									swal('Error!',error.message,'error');
								});
							},500);
						};
						functions.showloading();
						waitprocess();
					},
					function(error){swal('Error!',error.message,'error');});
				},function(error){swal('Error!',error.message,'error');});
			},
			function(){});
		},
		/* reload view */
		load:function(records){
			vars.table=$('<table id="checklist" class="customview-table">');
			vars.header=$('<tr>');
			vars.rows=$('<tbody>');
			vars.template=$('<tr>');
			/* create columns */
			vars.header.append($('<th>').addClass('fixed').append($('<p>').text('チェック項目')));
			vars.template.append($('<td>').addClass('fixed').append($('<p>')));
			for (var i=0;i<records.length;i++)
			{
				vars.header.append(
					$('<th>')
					.append($('<button class="customview-button edit-button">').on('click',function(){
						var cell=$(this).closest('th');
						var index=$('input#id',cell).val();
						window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+index+'&mode=show';
					}))
					.append($('<input type="hidden" id="id" value="'+records[i]['$id'].value+'">'))
				);
				vars.template.append($('<td>'));
			}
			/* create rows */
			vars.rows.empty();
			for (var i=0;i<vars.checklist.length;i++)
			{
				var row=vars.template.clone(true);
				var cells=$('td',row);
				var heads=$('th',vars.header);
				$('p',cells.first()).html(vars.checklist[i].question);
				for (var i2=0;i2<records.length;i2++) cells.eq(i2+1).html($.fieldvalue(records[i2][vars.checklist[i].answer]).replace(/<br>/g,','));
				vars.rows.append(row);
			}
			/* append elements */
			vars.table.append($('<thead>').append(vars.header));
			vars.table.append(vars.rows);
			vars.container.empty().append(vars.table);
		},
		showloading:function(){
			if (!$('div#loading').size()) $('body').append($('<div id="loading">'));
			$('div#loading').show();
		},
		hideloading:function(){
			$('div#loading').hide();
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.checklist) return;
		if (vars.checklist.length==0)
		{
			/* get layout */
			kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.layout=resp.layout;
				$.each(vars.layout,function(index,values){
					switch (values.type)
					{
						case 'ROW':
							if (values.fields.length==2)
							{
								if (values.fields[0].type=="LABEL" && $.inArray(values.fields[1].type,vars.answers)>-1)
								{
									vars.checklist.push({
										question:values.fields[0].label,
										answer:values.fields[1].code
									});
								}
							}
							break;
					}
				});
				/* get fieldinfo */
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
					/* initialize valiable */
					vars.container=$('div#checklist-container');
					vars.fieldinfos=resp.properties;
					/* append elements */
					kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok downloadbutton">')[0]);
					kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok uploadbutton">')[0]);
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<input type="file" class="file">').on('change',function(){functions.upload();}).hide()[0]
					);
					$('.downloadbutton')
					.text('ラベルデータ書出')
					.on('click',function(e){functions.download();});
					$('.uploadbutton')
					.text('ラベルデータ読込')
					.on('click',function(e){$('.file').trigger('click');});
					/* reload view */
					functions.load(event.records)
				},function(error){});
			},function(error){});
		}
		else
		{
			/* reload view */
			functions.load(event.records)
		}
	});
})(jQuery,kintone.$PLUGIN_ID);
