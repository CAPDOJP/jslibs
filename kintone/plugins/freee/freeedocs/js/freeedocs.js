/*
*--------------------------------------------------------------------
* jQuery-Plugin "freeedocs"
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
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		accesstoken:'',
		limit:500,
		offset:0,
		config:{},
		fieldinfos:{},
		records:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.detail.show'
		]
	};
	var functions={
		/* create request datas */
		createrequest:function(record){
			var tablecode='';
			var request={};
			var docitems=[];
			request['company_id']=parseInt($('select.companies').val());
			request['type']=$('select.doctype').val();
			request['partner_id']=functions.createrequestvalue(record,vars.config['partner_id'],'integer');
			request['partner_name']=functions.createrequestvalue(record,vars.config['partner_name']);
			request['partner_zipcode']=functions.createrequestvalue(record,vars.config['partner_zipcode']);
			request['partner_prefecture_code']=functions.createrequestvalue(record,vars.config['partner_prefecture_code'],'integer');
			request['partner_address1']=functions.createrequestvalue(record,vars.config['partner_address1']);
			request['partner_address2']=functions.createrequestvalue(record,vars.config['partner_address2']);
			request['partner_info']=functions.createrequestvalue(record,vars.config['partner_info']);
			request['company_info']=functions.createrequestvalue(record,vars.config['company_info']);
			request['description']=functions.createrequestvalue(record,vars.config['description']);
			request['issue_date']=functions.createrequestvalue(record,vars.config['issue_date']);
			request['sales_added_date']=functions.createrequestvalue(record,vars.config['sales_added_date']);
			request['payment_date']=functions.createrequestvalue(record,vars.config['payment_date']);
			request['bank_info']=functions.createrequestvalue(record,vars.config['bank_info']);
			request['doc_reference_id']=functions.createrequestvalue(record,vars.config['doc_reference_id']);
			request['notes']=functions.createrequestvalue(record,vars.config['notes']);
			request['tax_entry_method']=vars.config['taxshift'];
			request['status']=parseInt($('select.docstatus').val());
			if (!request['partner_id']) return null;
			if (!request['issue_date']) return null;
			tablecode=vars.fieldinfos[vars.config['qty']].tablecode;
			if (tablecode.length!=0)
			{
				for (var i=0;i<record[tablecode].value.length;i++)
				{
					var docitem={};
					var row=record[tablecode].value[i].value;
					var type=0;
					var unitprice=functions.createrequestvalue(row,vars.config['unit_price'],'integer');
					if (unitprice)
					{
						if (unitprice>0) type=0;
						else type=1;
					}
					else type=3;
					docitem['order']=i;
					docitem['qty']=(type!=3)?functions.createrequestvalue(row,vars.config['qty'],'integer'):null;
					docitem['unit']=(type!=3)?functions.createrequestvalue(row,vars.config['unit']):null;
					docitem['unit_price']=unitprice;
					docitem['description']=functions.createrequestvalue(row,vars.config['breakdown']);
					docitem['account_item_id']=(type!=3)?functions.createrequestvalue(row,vars.config['account_item_id'],'integer'):null;
					docitem['item_name']=(type!=3)?functions.createrequestvalue(row,vars.config['item_name']):null;
					docitem['section_name']=(type!=3)?functions.createrequestvalue(row,vars.config['section_name']):null;
					docitem['type']=type;
					docitems.push(docitem);
				}
			}
			request['doc_items']=$.grep(docitems,function(item,index){
				var exists=0;
				if (item['qty']) exists++;
				if (item['unit_price']) exists++;
				if (item['description']) exists++;
				return exists==3;
			});
			if (request['doc_items'].length==0) return null;
			return request;
		},
		createrequestvalue:function(record,field,number){
			var res=null;
			if (field in record)
			{
				if (record[field].value)
					if (record[field].value.toString().length!=0)
					{
						switch (number)
						{
							case 'integer':
								res=parseInt(record[field].value);
								break;
							case 'float':
								res=parseFloat(record[field].value);
								break;
							default:
								res=record[field].value;
								break;
						}
					}
			}
			return res;
		},
		/* get companies */
		getcompanies:function(type){
			kintone.proxy(
				'https://api.freee.co.jp/api/1/companies',
				'GET',
				{
					'Authorization':'Bearer '+vars.accesstoken
				},
				{},
				function(body,status,headers){
					if (status==200)
					{
						var json=JSON.parse(body);
						kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
							vars.fieldinfos=$.fieldparallelize(resp.properties);
							var companies=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="companies">')));
							var docstatus=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="docstatus">')));
							var doctype=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="doctype">')));
							var register=$('<button type="button" class="kintoneplugin-button-dialog-ok register">');
							/* setup elements */
							$('select',companies).append($('<option>').attr('value','').html('&nbsp;事業所選択&nbsp;'));
							for (var i=0;i<json.companies.length;i++)
							{
								var company=json.companies[i];
								$('select',companies).append($('<option>').attr('value',company.id).html('&nbsp;'+company.display_name+'&nbsp;'));
							}
							$('select',docstatus).append($('<option>').attr('value','').html('&nbsp;ステータス&nbsp;'));
							$('select',docstatus).append($('<option>').attr('value','0').html('&nbsp;下書き&nbsp;'));
							$('select',docstatus).append($('<option>').attr('value','3').html('&nbsp;発行&nbsp;'));
							$('select',doctype).append($('<option>').attr('value','').html('&nbsp;書類種別&nbsp;'));
							$('select',doctype).append($('<option>').attr('value','invoice').html('&nbsp;請求書&nbsp;'));
							$('select',doctype).append($('<option>').attr('value','delivery_note').html('&nbsp;納品書&nbsp;'));
							$('select',doctype).append($('<option>').attr('value','quotation').html('&nbsp;見積書&nbsp;'));
							$('select',doctype).append($('<option>').attr('value','order_sheet').html('&nbsp;発注書&nbsp;'));
							$('select',doctype).append($('<option>').attr('value','income_receipt').html('&nbsp;領収書&nbsp;'));
							register.text('Freeeへ取引登録').on('click',function(e){
								if ($('select.companies').val().length==0)
								{
									swal('Error!','事業所を選択して下さい。','error');
									return;
								}
								if ($('select.doctype').val().length==0)
								{
									swal('Error!','書類種別を選択して下さい。','error');
									return;
								}
								if ($('select.docstatus').val().length==0)
								{
									swal('Error!','発行ステータスを選択して下さい。','error');
									return;
								}
								swal({
									title:'確認',
									text:'Freeeに取引データを登録します。宜しいですか？',
									type:'info',
									showCancelButton:true,
									cancelButtonText:'Cancel'
								},
								function(){
									functions.registerfreee(type);
								});
							});
							/* clear elements */
							if ($('.custom-elements').size()) $('.custom-elements').remove();
							/* append elements */
							if (type=='list')
							{
								kintone.app.getHeaderMenuSpaceElement().appendChild(companies.addClass('custom-elements')[0]);
								kintone.app.getHeaderMenuSpaceElement().appendChild(doctype.addClass('custom-elements')[0]);
								kintone.app.getHeaderMenuSpaceElement().appendChild(docstatus.addClass('custom-elements')[0]);
								kintone.app.getHeaderMenuSpaceElement().appendChild(register.addClass('custom-elements')[0]);
							}
							else
							{
								if ($('.gaia-app-statusbar').is(':visible')) $('.gaia-app-statusbar').css({'margin-right':'8px'});
								$('.gaia-argoui-app-toolbar-statusmenu').append(companies.addClass('custom-elements'));
								$('.gaia-argoui-app-toolbar-statusmenu').append(doctype.addClass('custom-elements'));
								$('.gaia-argoui-app-toolbar-statusmenu').append(docstatus.addClass('custom-elements'));
								$('.gaia-argoui-app-toolbar-statusmenu').append(register.addClass('custom-elements'));
							}
						});
					}
					else
					{
						swal('Error!','事業所一覧データの取得に失敗しました。','error');
					}
				},
				function(error){
					swal('Error!','Freeeへの接続に失敗しました。','error');
				}
			);
		},
		/* get token */
		gettoken:function(type,callback){
			/* get access token */
			var regex=new RegExp("access_token=([^&#]*)");
			var results=regex.exec(window.location.href);
			if (results!=null)
			{
				vars.accesstoken=decodeURIComponent(results[1].replace(/\+/g," "));
				callback();
			}
			else
			{
				/* redirect authorize url */
				if (type=='list')
				{
					var authurl='https://secure.freee.co.jp/oauth/authorize?response_type=token';
					authurl+='&client_id='+vars.config['freeeappid'];
					authurl+='&redirect_uri='+encodeURI(decodeURI(window.location.href));
					window.location.href=authurl;
				}
			}
		},
		/* load app datas */
		loaddatas:function(callback){
			var sort='';
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){
				functions.hideloading();
				swal('Error!',error.message,'error');
			});
		},
		/* register */
		registerfreee:function(type){
			var request={};
			var register=function(requests){
				var error=false;
				var counter=requests.length;
				for (var i=0;i<requests.length;i++)
				{
					if (error) break;
					kintone.proxy(
						'https://api.freee.co.jp/api/1/docs',
						'POST',
						{
							'Authorization':'Bearer '+vars.accesstoken,
							'Content-Type':'application/json'
						},
						requests[i],
						function(body,status,headers){
							switch (status)
							{
								case 400:
									functions.hideloading();
									swal('Error!','不正なリクエストです。','error');
									error=true;
									break;
								case 401:
									functions.hideloading();
									swal('Error!','サーバーへのアクセスが拒否されました。','error');
									error=true;
									break;
								case 500:
									functions.hideloading();
									swal('Error!','サーバー内で障害が発生しています。','error');
									error=true;
									break;
								default:
									counter--;
									if (counter==0)
									{
										functions.hideloading();
										swal('登録完了','Freeeへの登録が完了しました。','success');
									}
									break;
							}
						},
						function(error){
							functions.hideloading();
							swal('Error!','Freeeへの接続に失敗しました。','error');
							error=true;
						}
					);
				}
			};
			functions.showloading();
			switch (type)
			{
				case 'list':
					var values=[];
					vars.offset=0;
					vars.records=[];
					functions.loaddatas(function(){
						if (vars.records.length==0)
						{
							functions.hideloading();
							setTimeout(function(){
								swal('Error!','レコードがありません。','error');
							},500);
							return;
						}
						for (var i=0;i<vars.records.length;i++)
						{
							request=functions.createrequest(vars.records[i]);
							if (request) values.push(request);
						}
						if (values.length!=0) register(values);
						else
						{
							functions.hideloading();
							setTimeout(function(){
								swal('Error!','登録可能なレコードが見つかりませんでした。','error');
							},500);
						}
					});
					break;
				case 'show':
					request=functions.createrequest(kintone.app.record.get().record);
					if (request) register([request]);
					else
					{
						functions.hideloading();
						setTimeout(function(){
							swal('Error!','登録可能なレコードではありません。','error');
						},500);
					}
					break;
			}
		},
		/* switch view of loading */
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
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		functions.gettoken('list',function(){
			functions.getcompanies('list');
		});
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		functions.gettoken('show',function(){
			functions.getcompanies('show');
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
