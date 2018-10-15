/*
*--------------------------------------------------------------------
* jQuery-Plugin "freeedeals"
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
			var details=[];
			var payments=[];
			request['company_id']=parseInt($('select.companies').val());
			request['type']=$('select.dealtypes').val();
			request['issue_date']=functions.createrequestvalue(record,vars.config['issue_date']);
			request['due_date']=functions.createrequestvalue(record,vars.config['due_date']);
			request['partner_id']=functions.createrequestvalue(record,vars.config['partner_id'],'integer');
			request['ref_number']=functions.createrequestvalue(record,vars.config['ref_number']);
			if (!request['issue_date']) return null;
			tablecode=vars.fieldinfos[vars.config['amount']].tablecode;
			if (tablecode.length!=0)
			{
				for (var i=0;i<record[tablecode].value.length;i++)
				{
					var detail={};
					var row=record[tablecode].value[i].value;
					detail['amount']=functions.createrequestvalue(row,vars.config['amount'],'integer');
					detail['account_item_id']=functions.createrequestvalue(row,vars.config['account_item_id'],'integer');
					detail['tax_code']=functions.createrequestvalue(row,vars.config['tax_code'],'integer');
					detail['item_id']=functions.createrequestvalue(row,vars.config['item_id'],'integer');
					detail['section_id']=functions.createrequestvalue(row,vars.config['section_id'],'integer');
					detail['description']=functions.createrequestvalue(row,vars.config['description']);
					details.push(detail);
				}
			}
			else
			{
				var detail={};
				detail['amount']=functions.createrequestvalue(record,vars.config['amount'],'integer');
				detail['account_item_id']=functions.createrequestvalue(record,vars.config['account_item_id'],'integer');
				detail['tax_code']=functions.createrequestvalue(record,vars.config['tax_code'],'integer');
				detail['item_id']=functions.createrequestvalue(record,vars.config['item_id'],'integer');
				detail['section_id']=functions.createrequestvalue(record,vars.config['section_id'],'integer');
				detail['description']=functions.createrequestvalue(record,vars.config['description']);
				details.push(detail);
			}
			request['details']=$.grep(details,function(item,index){
				var exists=0;
				if (item['amount']) exists++;
				if (item['account_item_id']) exists++;
				if (item['tax_code']) exists++;
				return exists==3;
			});
			if (request['details'].length==0) return null;
			if (vars.config['addwalletable']=='1')
			{
				tablecode=vars.fieldinfos[vars.config['from_walletable_date']].tablecode;
				if (tablecode.length!=0)
				{
					for (var i=0;i<record[tablecode].value.length;i++)
					{
						var payment={};
						var row=record[tablecode].value[i].value;
						payment['date']=functions.createrequestvalue(row,vars.config['from_walletable_date']);
						payment['from_walletable_type']=functions.createrequestvalue(row,vars.config['from_walletable_type']);
						payment['from_walletable_id']=functions.createrequestvalue(row,vars.config['from_walletable_id'],'integer');
						payment['amount']=functions.createrequestvalue(row,vars.config['from_walletable_amount'],'integer');
						payments.push(payment);
					}
				}
				else
				{
					var payment={};
					payment['date']=functions.createrequestvalue(record,vars.config['from_walletable_date']);
					payment['from_walletable_type']=functions.createrequestvalue(record,vars.config['from_walletable_type']);
					payment['from_walletable_id']=functions.createrequestvalue(record,vars.config['from_walletable_id'],'integer');
					payment['amount']=functions.createrequestvalue(record,vars.config['from_walletable_amount'],'integer');
					payments.push(payment);
				}
			}
			request['payments']=$.grep(payments,function(item,index){
				var exists=0;
				if (item['date']) exists++;
				if (item['from_walletable_type']) exists++;
				if (item['from_walletable_id']) exists++;
				if (item['amount']) exists++;
				return exists==4;
			});
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
							var dealtypes=$('<div class="kintoneplugin-select-outer">').append($('<div class="kintoneplugin-select">').append($('<select class="dealtypes">')));
							var register=$('<button type="button" class="kintoneplugin-button-dialog-ok register">');
							/* setup elements */
							$('select',companies).append($('<option>').attr('value','').html('&nbsp;事業所選択&nbsp;'));
							for (var i=0;i<json.companies.length;i++)
							{
								var company=json.companies[i];
								$('select',companies).append($('<option>').attr('value',company.id).html('&nbsp;'+company.display_name+'&nbsp;'));
							}
							$('select',dealtypes).append($('<option>').attr('value','').html('&nbsp;収支区分選択&nbsp;'));
							$('select',dealtypes).append($('<option>').attr('value','income').html('&nbsp;収入&nbsp;'));
							$('select',dealtypes).append($('<option>').attr('value','expense').html('&nbsp;支出&nbsp;'));
							register.text('Freeeへ取引登録').on('click',function(e){
								if ($('select.companies').val().length==0)
								{
									swal('Error!','事業所を選択して下さい。','error');
									return;
								}
								if ($('select.dealtypes').val().length==0)
								{
									swal('Error!','収支区分を選択して下さい。','error');
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
								kintone.app.getHeaderMenuSpaceElement().appendChild(dealtypes.addClass('custom-elements')[0]);
								kintone.app.getHeaderMenuSpaceElement().appendChild(register.addClass('custom-elements')[0]);
							}
							else
							{
								if ($('.gaia-app-statusbar').is(':visible')) $('.gaia-app-statusbar').css({'margin-right':'8px'});
								$('.gaia-argoui-app-toolbar-statusmenu').append(companies.addClass('custom-elements'));
								$('.gaia-argoui-app-toolbar-statusmenu').append(dealtypes.addClass('custom-elements'));
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
						'https://api.freee.co.jp/api/1/deals',
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
		kintone.proxy(
			vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
			'GET',
			{},
			{},
			function(body,status,headers){
				if (status>=200 && status<300)
				{
					var json=JSON.parse(body);
					if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
					functions.gettoken('list',function(){
						functions.getcompanies('list');
					});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		kintone.proxy(
			vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
			'GET',
			{},
			{},
			function(body,status,headers){
				if (status>=200 && status<300)
				{
					var json=JSON.parse(body);
					if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
					functions.gettoken('show',function(){
						functions.getcompanies('show');
					});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
