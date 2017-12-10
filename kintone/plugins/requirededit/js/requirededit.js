/*
*--------------------------------------------------------------------
* jQuery-Plugin "requirededit"
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
		loaded:false,
		settings:null,
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		]
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
					case 'SUBTABLE':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
				}
			});
			return codes;
		},
		loadfieldinfos:function(callback){
			vars.fieldinfos={};
			/* get layout */
			kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
				var sorted=functions.fieldsort(resp.layout);
				/* get fieldinfo */
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
					$.each(resp.properties,function(key,values){
						/* check required */
						if ('required' in values) vars.fieldinfos[key]=values;
					});
					if (!vars.loaded)
					{
						vars.settings=new settingform();
						kintone.app.getHeaderMenuSpaceElement().appendChild(
							$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/function.svg" alt="フィールド編集" title="フィールド編集" />')
							.css({
								'cursor':'pointer',
								'display':'inline-block',
								'height':'48px',
								'margin':'0px 12px',
								'vertical-align':'top',
								'width':'48px'
							})
							.on('click',function(e){vars.settings.show({fieldinfos:vars.fieldinfos})})[0]
						);
					}
					vars.loaded=true;
				},function(error){});
			},function(error){});
		}
	};
	var settingform=function(){
		/* property */
		this.fieldinfos={};
		/* create elements */
		var my=this;
		var div=$('<div>').css({
			'box-sizing':'border-box',
			'margin':'0px',
			'padding':'0px',
			'position':'relative',
			'vertical-align':'top'
		});
		var button=$('<button>').css({
			'background-color':'transparent',
			'border':'none',
			'box-sizing':'border-box',
			'color':'#FFFFFF',
			'cursor':'pointer',
			'font-size':'13px',
			'height':'auto',
			'line-height':'30px',
			'margin':'0px 3px',
			'outline':'none',
			'padding':'0px 1em',
			'vertical-align':'top',
			'width':'auto'
		});
		var checkbox=$('<label>').css({
			'box-sizing':'border-box',
			'display':'inline-block',
			'line-height':'30px',
			'margin':'0px',
			'padding':'0px',
			'vertical-align':'top',
			'width':'100px'
		})
		.append($('<input type="checkbox">'))
		.append($('<span class="label">').css({'color':'#3498db','padding':'0px 10px 0px 5px'}));
		var textline=$('<input type="text">').css({
			'border':'1px solid #3498db',
			'border-radius':'2px',
			'box-sizing':'border-box',
			'display':'lnline-block',
			'height':'30px',
			'line-height':'30px',
			'margin':'0px 10px 0px 0px',
			'padding':'0px 5px',
			'vertical-align':'top',
			'width':'calc(50% - 100px)'
		});
		/* append elements */
		this.cover=div.clone(true).css({
			'background-color':'rgba(0,0,0,0.5)',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'position':'fixed',
			'top':'0px',
			'width':'100%',
			'z-index':'999999'
		});
		this.container=div.clone(true).css({
			'background-color':'#FFFFFF',
			'bottom':'0',
			'border-radius':'5px',
			'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
			'left':'0',
			'margin':'auto',
			'max-height':'90%',
			'max-width':'90%',
			'padding':'5px',
			'position':'absolute',
			'right':'0',
			'text-align':'center',
			'top':'0',
			'width':'600px'
		});
		this.contents=div.clone(true).css({
			'height':'100%',
			'margin':'0px',
			'overflow-x':'hidden',
			'overflow-y':'auto',
			'padding':'5px',
			'position':'relative',
			'text-align':'left',
			'width':'100%',
			'z-index':'1'
		});
		this.buttonblock=div.clone(true).css({
			'background-color':'#3498db',
			'border-bottom-left-radius':'5px',
			'border-bottom-right-radius':'5px',
			'bottom':'0px',
			'left':'0px',
			'padding':'5px',
			'position':'absolute',
			'text-align':'center',
			'width':'100%',
			'z-index':'2'
		});
		this.template=div.clone(true).addClass('fields').css({'border-bottom':'1px dotted #3498db','padding':'5px','width':'100%'});
		this.template
		.append(textline.clone(true).addClass('name'))
		.append(textline.clone(true).addClass('code'))
		.append(checkbox.clone(true).addClass('required'))
		.append(checkbox.clone(true).addClass('unique'))
		$('.label',$('required',this.template)).text('必須項目');
		$('.label',$('unique',this.template)).text('重複禁止');
		my.buttonblock.append(
			button.clone(true)
			.text('OK')
			.on('click',function(e){
				$.each($('.fields',my.contents),function(index){
					var row=$(this);
					my.fieldinfos[row.attr('id')].label=$('.name',row).val();
					my.fieldinfos[row.attr('id')].code=$('.code',row).val();
					my.fieldinfos[row.attr('id')].required=$('.receiver',$('.required',row)).prop('checked');
					if ($('.unique',row).is(':visible')) my.fieldinfos[row.attr('id')].unique=$('.receiver',$('.unique',row)).prop('checked');
				});
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'PUT',{app:kintone.app.getId(),properties:my.fieldinfos},function(resp){
					swal({
						title:'更新完了',
						text:'フォーム設定を変更しました。',
						type:'success'
					},function(){location.reload(true);});
				},
				function(error){
					my.hide();
					swal('Error!',error.message,'error');
				});
			})
		);
		my.buttonblock.append(
			button.clone(true)
			.text('キャンセル')
			.on('click',function(e){my.hide();})
		);
		this.container.append(this.contents);
		this.container.append(this.buttonblock);
		this.cover.append(this.container);
		$('body').append(this.cover);
		/* adjust container height */
		$(window).on('load resize',function(){
			my.contents.css({'height':(my.container.innerHeight()-my.buttonblock.outerHeight(true)).toString()+'px'});
		});
	};
	settingform.prototype={
		/* display form */
		show:function(options){
			var options=$.extend({
				fieldinfos:{}
			},options);
			var my=this;
			/* clear fields */
			this.contents.empty();
			/* initialize property */
			this.fieldinfos=options.fieldinfos;
			/* append fields */
			$.each(this.fieldinfos,function(key,values){
				var row=my.template.clone(true).attr('id',values.code);
				$('.name',row).val(values.label);
				$('.code',row).val(values.code);
				$('.receiver',$('required',row)).prop('checked',values.required);
				if ('unique' in values) $('.receiver',$('.unique',row)).prop('checked',values.unique);
				else $('.unique',row).hide();
				my.contents.append(row);
			});
			this.cover.show();
			/* adjust container height */
			this.contents.css({'height':(this.container.innerHeight()-this.buttonblock.outerHeight(true)).toString()+'px'});
		},
		/* hide form */
		hide:function(){
			this.cover.hide();
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		/* load fieldinfos */
		functions.loadfieldinfos();
		return event;
	});
	kintone.events.on(events.show,function(event){
		/* load fieldinfos */
		functions.loadfieldinfos();
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
