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
		progress:null,
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
		containers:[]
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
			$.each(vars.rows.find('tr'),function(index){
				var row=$(this);
				downloadvalue+=$('.question',row).html()+',';
				downloadvalue+=$('.answer',row).html();
				downloadvalue+='\n';
			});
			$.downloadtext(downloadvalue,'SJIS','checklist.csv');
		},
		/* upload nss records */
		upload:function(){
			var error=false;
			var counter=0;
			var target=$('.file');
			var checkvalues=[];
			if (target[0].files.length==0) return;
			vars.progress.find('.message').text('データ登録中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			$.uploadtext(target[0].files[0],'UNICODE',function(records){
				records=records.split('\n');
				for (var i=0;i<records.length;i++)
				{
					if (records[i].length==0) continue;
					var record=records[i].split(',');
					var checkindex=i%vars.checklist.length;
					var checkvalue={};
					if (checkindex==0)
					{
						checkvalues.push({
							app:kintone.app.getId(),
							record:{}
						});
					}
					checkvalue=checkvalues[checkvalues.length-1];
					switch (vars.fieldinfos[vars.checklist[checkindex].answer].type)
					{
						case 'CHECK_BOX':
						case 'MULTI_SELECT':
							checkvalue.record[vars.checklist[checkindex].answer]={value:record[1].split('-')};
							break;
						default:
							checkvalue.record[vars.checklist[checkindex].answer]={value:record[1]};
							break;
					}
				}
				if (checkvalues.length!=0)
				{
					for (var i=0;i<checkvalues.length;i++)
					{
						if (error) return;
						kintone.api(kintone.api.url('/k/v1/record',true),'POST',checkvalues[i],function(resp){
							counter++;
							if (counter<checkvalues.length)
							{
								vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/checkvalues.length));
							}
							else
							{
								vars.progress.hide();
								swal({
									title:'登録完了',
									text:'登録しました。',
									type:'success'
								},function(){
									location.reload(true);
								});
							}
						},function(error){
							vars.progress.hide();
							swal('Error!',error.message,'error');
							error=true;
						});
					}
				}
				else
				{
					vars.progress.hide();
					swal('Error!','アップロードしたファイルに登録データが見つかりませんでした。','error');
				}
			},
			function(){vars.progress.hide();});
		},
		/* reload view */
		load:function(records){
			vars.rows.empty();
			for (var i=0;i<records.length;i++)
			{
				var record=records[i];
				for (var i2=0;i2<vars.checklist.length;i2++)
				{
					var row=vars.template.clone(true);
					$('.question',row).html(vars.checklist[i2].question);
					$('.answer',row).html($.fieldvalue(record[vars.checklist[i2].answer]));
					$('#id',row).val(record['$id'].value);
					vars.rows.append(row);
				}
				/* merge row */
				vars.rows.find('tr').eq(i*vars.checklist.length).find('td').first().attr('rowspan',vars.checklist.length);
				for (var i2=i*vars.checklist.length+1;i2<vars.rows.find('tr').length;i2++) vars.rows.find('tr').eq(i2).find('td').first().hide();
			}
			/* append fix containers */
			$.each(vars.table.parents(),function(index){
				var check=$(this).attr('style');
				if (check)
					if (check.indexOf(vars.table.width().toString()+'px')>-1) vars.containers.push($(this));
			});
			if (vars.containers.length==0) vars.containers.push(vars.container);
			/* mouse events */
			$(vars.table).on('mousemove','td,th',function(e){
				if (vars.drag.capture) return;
				var left=e.pageX-$(this).offset().left;
				var hit=true;
				if (left<$(this).outerWidth(false)-5) hit=false;
				if (left>$(this).outerWidth(false)) hit=false;
				if (hit) $(this).addClass('adjust');
				else $(this).removeClass('adjust');
			});
			$(vars.table).on('mousedown','td,th',function(e){
				if (!$(this).hasClass('adjust')) return;
				vars.drag.capture=true;
				vars.drag.keep.column=$(this).outerWidth(false);
				vars.drag.keep.container=vars.containers[0].outerWidth(false);
				vars.drag.keep.position=e.pageX;
				/* setup resize column */
				vars.drag.cells=[];
				$.each($('td,th',vars.table),function(index){
					if (e.pageX>$(this).offset().left && e.pageX<$(this).offset().left+$(this).outerWidth(false)) vars.drag.cells.push($(this));
				});
				e.stopPropagation();
				e.preventDefault();
			});
			$(window).on('mousemove',function(e){
				if (!vars.drag.capture) return;
				var width=0;
				width=vars.drag.keep.column+e.pageX-vars.drag.keep.position;
				if (width<15) width=15;
				/* resize column */
				$.each(vars.drag.cells,function(index){
					vars.drag.cells[index].css({'width':width.toString()+'px'});
					vars.drag.cells[index].find('div').css({'width':width.toString()+'px'});
				});
				/* resize container */
				$.each(vars.containers,function(index){
					vars.containers[index].css({'width':(vars.drag.keep.container-vars.drag.keep.column+width).toString()+'px'});
				});
				e.stopPropagation();
				e.preventDefault();
			});
			$(window).on('mouseup',function(e){
				if (!vars.drag.capture) return;
				vars.drag.capture=false;
				e.stopPropagation();
				e.preventDefault();
			});
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
				$.each(resp.layout,function(index,values){
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
					vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
					vars.table=$('<table id="checklist" class="customview-table">');
					vars.header=$('<tr>');
					vars.rows=$('<tbody>');
					vars.template=$('<tr>');
					vars.fieldinfos=resp.properties;
					/* append elements */
					kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok downloadbutton">')[0]);
					kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok uploadbutton">')[0]);
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<input type="file" class="file">').on('change',function(){functions.upload();}).hide()[0]
					);
					$('.downloadbutton')
					.text('データ書出')
					.on('click',function(e){functions.download();});
					$('.uploadbutton')
					.text('データ読込')
					.on('click',function(e){$('.file').trigger('click');});
					$('body').append(vars.progress);
					/* append button column */
					vars.header.append($('<th>').text(''));
					vars.template.append($('<td class="buttoncell">')
						.append($('<button class="customview-button edit-button">').on('click',function(){
							var row=$(this).closest('tr');
							var index=row.find('td').first().find('input#id').val();
							window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+index+'&mode=show';
						}))
						.append($('<input type="hidden" id="id" value="">'))
					);
					/* append columns */
					vars.header.append($('<th>').append($('<div>').addClass('question').text('チェック項目')));
					vars.header.append($('<th>').append($('<div>').addClass('answer').text('回答')));
					vars.template.append($('<td>').append($('<div>').addClass('question')));
					vars.template.append($('<td>').append($('<div>').addClass('answer')));
					/* append elements */
					vars.table.append($('<thead>').append(vars.header));
					vars.table.append(vars.rows);
					vars.container.empty().append(vars.table);
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
