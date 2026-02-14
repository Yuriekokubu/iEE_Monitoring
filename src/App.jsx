import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Papa from "papaparse";
import { Search, Loader2, CheckCircle2, AlertCircle, Database, FileSpreadsheet, List, ChevronRight, RefreshCw, BarChart3, Copy, Check, Clock, Activity, Zap, TrendingUp } from "lucide-react";

function App() {
	const [billingList, setBillingList] = useState([]);
	const [selectedDate, setSelectedDate] = useState(null);
	const [totalInBilling, setTotalInBilling] = useState(0);
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [loadingDates, setLoadingDates] = useState(true);
	const [error, setError] = useState(null);
	const [copied, setCopied] = useState(false);
	const [countdown, setCountdown] = useState(60);

	const stateRef = useRef({ selectedDate, billingList });
	useEffect(() => {
		stateRef.current = { selectedDate, billingList };
	}, [selectedDate, billingList]);

	// 1. โหลด Billing Dates ครั้งแรก
	useEffect(() => {
		fetchBillingDates();
	}, []);

	// 2. Auto-select วันพรุ่งนี้ (วันปัจจุบัน + 1) เมื่อโหลด Billing List เสร็จ
	useEffect(() => {
		if (billingList.length > 0 && !selectedDate) {
			// คำนวณวันพรุ่งนี้
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const year = tomorrow.getFullYear();
			const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
			const day = String(tomorrow.getDate()).padStart(2, "0");
			const tomorrowBilling = `${year}${month}${day}`;

			// หา billing date ที่ตรงกับวันพรุ่งนี้
			const matchingBilling = billingList.find((b) => b.BillingDate === tomorrowBilling);

			if (matchingBilling) {
				selectBilling(matchingBilling.BillingDate, matchingBilling.UniqueMeters);
			}
		}
	}, [billingList]);

	// 3. Timer นับถอยหลัง
	useEffect(() => {
		const timer = setInterval(() => {
			setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	// 4. Trigger Auto-refresh เมื่อครบ 1 นาที
	useEffect(() => {
		if (countdown === 0) {
			const { selectedDate: currentSelected, billingList: currentList } = stateRef.current;
			if (currentSelected) {
				const currentBilling = currentList.find((b) => b.BillingDate === currentSelected);
				const total = currentBilling ? currentBilling.UniqueMeters : 0;
				selectBilling(currentSelected, total, true);
			}
			setCountdown(60);
		}
	}, [countdown]);

	const fetchBillingDates = async () => {
		try {
			setLoadingDates(true);
			const res = await axios.get("http://localhost:5000/api/billing-dates");
			setBillingList(res.data);
		} catch (err) {
			setError("ไม่สามารถดึงรายการ Billing Dates ได้");
		} finally {
			setLoadingDates(false);
		}
	};

	const selectBilling = async (billingDate, uniqueCount, isAutoRefresh = false) => {
		if (!isAutoRefresh) {
			setData([]);
			setCountdown(60);
			setLoading(true);
		} else {
			setLoading(true);
		}

		setSelectedDate(billingDate);
		setTotalInBilling(uniqueCount);

		const year = parseInt(billingDate.substring(0, 4));
		const month = parseInt(billingDate.substring(4, 6)) - 1;
		const day = parseInt(billingDate.substring(6, 8));
		const dateObj = new Date(year, month, day);

		const formatDate = (d) => {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, "0");
			const dd = String(d.getDate()).padStart(2, "0");
			return `${y}-${m}-${dd}`;
		};

		const startObj = new Date(dateObj);
		startObj.setDate(dateObj.getDate() - 2);
		const endObj = new Date(dateObj);
		endObj.setDate(dateObj.getDate() - 1);

		const payload = {
			billingDate: billingDate,
			startTarget: `${formatDate(startObj)} 00:00`,
			endTarget: `${formatDate(endObj)} 23:59`,
		};

		try {
			const response = await axios.post("http://localhost:5000/api/meter-exceptions", payload);
			setData(response.data);
		} catch (err) {
			if (!isAutoRefresh) setError("โหลดข้อมูลสถานะมิเตอร์ไม่สำเร็จ");
		} finally {
			setLoading(false);
		}
	};

	const copyMeterIDs = () => {
		if (data.length === 0) return;
		const meterIdsText = data.map((item) => item.MeterID).join("\n");
		navigator.clipboard.writeText(meterIdsText).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const exportCSV = () => {
		const csv = Papa.unparse(data);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.setAttribute("href", URL.createObjectURL(blob));
		link.setAttribute("download", `Meter_Status_${selectedDate}.csv`);
		link.click();
	};

	const totalMeters = totalInBilling;
	const exceptionCount = data.filter((item) => !item.Status.startsWith("Found")).length;
	const foundCount = totalMeters - exceptionCount;
	const successRate = totalMeters > 0 ? ((foundCount / totalMeters) * 100).toFixed(1) : 0;

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
			{/* Modern Navbar with Glassmorphism */}
			<nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 backdrop-blur-lg bg-opacity-95 text-white shadow-2xl sticky top-0 z-50 border-b border-blue-400/20">
				<div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 sm:gap-4">
							<div className="relative">
								<div className="absolute inset-0 bg-blue-500 blur-xl opacity-50 animate-pulse"></div>
								<Database className="text-blue-400 relative z-10" size={24} strokeWidth={2.5} />
							</div>
							<div>
								<h1 className="font-black text-base sm:text-xl tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">ItronEE Monitor</h1>
								<p className="text-[9px] sm:text-[10px] text-slate-400 font-medium hidden sm:block">Real-time Meter Monitoring System</p>
							</div>
						</div>

						<div className="flex items-center gap-2 sm:gap-4">
							{/* Live Status Indicator */}
							<div className="hidden md:flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-700/50">
								<Activity className="text-emerald-400" size={14} />
								<span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
								<div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
							</div>

							{/* Countdown Timer */}
							<div
								className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all duration-500 ${
									countdown < 10
										? "bg-gradient-to-r from-rose-600 to-pink-600 border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105"
										: "bg-slate-800/50 backdrop-blur-sm border-slate-700/50"
								}`}
							>
								<Clock size={12} className={countdown < 10 ? "text-white animate-pulse" : "text-blue-400"} />
								<span className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wider ${countdown < 10 ? "text-white" : "text-slate-300"}`}>
									<span className="hidden sm:inline">Refresh: </span>
									{countdown}s
								</span>
							</div>

							{/* Database Info */}
							<div className="hidden lg:flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-700/50">
								<div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
								<span className="text-[10px] text-slate-300 font-mono">172.16.136.80</span>
							</div>
						</div>
					</div>
				</div>
			</nav>

			<div className="max-w-[1800px] mx-auto p-3 sm:p-6">
				<div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
					{/* Modern Sidebar */}
					<aside className="w-full lg:w-80 shrink-0">
						<div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden lg:sticky lg:top-24">
							<div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 flex justify-between items-center">
								<div className="flex items-center gap-2">
									<List size={16} className="text-white" />
									<span className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide">Billing Dates</span>
								</div>
								<button
									onClick={() => {
										fetchBillingDates();
										setCountdown(60);
									}}
									className="text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:rotate-180"
								>
									<RefreshCw size={14} className={loadingDates ? "animate-spin" : ""} />
								</button>
							</div>

							<div className="max-h-[300px] sm:max-h-[400px] lg:max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
								{billingList.map((item, idx) => {
									// คำนวณวันพรุ่งนี้ (วันปัจจุบัน + 1)
									const tomorrow = new Date();
									tomorrow.setDate(tomorrow.getDate() + 1);
									const tomorrowYear = tomorrow.getFullYear();
									const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
									const tomorrowDay = String(tomorrow.getDate()).padStart(2, "0");
									const tomorrowBilling = `${tomorrowYear}${tomorrowMonth}${tomorrowDay}`;

									// กดได้ถ้า billing date <= วันพรุ่งนี้
									const isClickable = parseInt(item.BillingDate) <= parseInt(tomorrowBilling);

									return (
										<div
											key={item.BillingDate}
											onClick={() => isClickable && selectBilling(item.BillingDate, item.UniqueMeters)}
											className={`
												transition-all duration-300 border-b border-slate-100 last:border-b-0
												${
													!isClickable
														? "opacity-40 cursor-not-allowed bg-slate-50"
														: `cursor-pointer ${
																selectedDate === item.BillingDate
																	? "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg scale-[0.98]"
																	: "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50"
														  }`
												}
											`}
										>
											<div className="px-3 sm:px-5 py-1.5 sm:py-2 flex items-center justify-between group">
												<div className="flex items-center gap-2 sm:gap-3">
													<div
														className={`
														w-2 h-2 rounded-full transition-all duration-300
														${!isClickable ? "bg-slate-300" : selectedDate === item.BillingDate ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "bg-blue-400"}
													`}
													></div>
													<span
														className={`
														font-bold text-xs sm:text-sm font-mono tracking-tight
														${!isClickable ? "text-slate-400 line-through" : selectedDate === item.BillingDate ? "text-white" : "text-slate-700"}
													`}
													>
														{item.BillingDate}
													</span>
												</div>
												<div className="flex items-center gap-1.5 sm:gap-2">
													<span
														className={`
														text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg
														${!isClickable ? "bg-slate-200 text-slate-400" : selectedDate === item.BillingDate ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"}
													`}
													>
														{item.UniqueMeters.toLocaleString()}
													</span>
													<ChevronRight
														size={14}
														className={`transition-transform duration-300 ${
															!isClickable
																? "text-slate-300"
																: selectedDate === item.BillingDate
																? "text-white translate-x-1"
																: "text-slate-400 group-hover:translate-x-1"
														}`}
													/>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</aside>

					{/* Main Content */}
					<main className="flex-1 min-w-0 space-y-4 sm:space-y-6">
						{/* Modern Stats Cards */}
						{selectedDate && (
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
								{/* Total Meters Card */}
								<div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
									<div className="flex items-start justify-between mb-2 sm:mb-3">
										<div className="p-2 sm:p-3 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg sm:rounded-xl">
											<BarChart3 className="text-slate-700" size={18} />
										</div>
										<div className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total</div>
									</div>
									<div className="text-xl sm:text-3xl font-black text-slate-800 mb-1">{totalMeters.toLocaleString()}</div>
									<div className="text-[9px] sm:text-xs text-slate-500 font-medium">ทั้งหมดในรอบบิล</div>
								</div>

								{/* Success Card */}
								<div className="bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-emerald-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
									<div className="flex items-start justify-between mb-2 sm:mb-3">
										<div className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm">
											<CheckCircle2 className="text-emerald-600" size={18} />
										</div>
										<div className="text-[9px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider">Success</div>
									</div>
									<div className="text-xl sm:text-3xl font-black text-emerald-700 mb-1 flex items-center gap-2">
										{loading && data.length === 0 ? (
											<Loader2 size={24} className="animate-spin text-emerald-400" />
										) : (
											<>
												{foundCount.toLocaleString()}
												{loading && <Loader2 size={16} className="animate-spin text-emerald-400" />}
											</>
										)}
									</div>
									<div className="text-[9px] sm:text-xs text-emerald-600 font-medium">อ่านหน่วยได้</div>
								</div>

								{/* Exception Card */}
								<div className="bg-gradient-to-br from-rose-50 to-pink-50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-rose-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
									<div className="flex items-start justify-between mb-2 sm:mb-3">
										<div className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm">
											<AlertCircle className="text-rose-600" size={18} />
										</div>
										<div className="text-[9px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider">Exception</div>
									</div>
									<div className="text-xl sm:text-3xl font-black text-rose-700 mb-1 flex items-center gap-2">
										{loading && data.length === 0 ? (
											<Loader2 size={24} className="animate-spin text-rose-400" />
										) : (
											<>
												{exceptionCount.toLocaleString()}
												{loading && <Loader2 size={16} className="animate-spin text-rose-400" />}
											</>
										)}
									</div>
									<div className="text-[9px] sm:text-xs text-rose-600 font-medium">มิเตอร์</div>
								</div>

								{/* Success Rate Card */}
								<div className="bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
									<div className="flex items-start justify-between mb-2 sm:mb-3">
										<div className="p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm">
											<TrendingUp className="text-blue-600" size={18} />
										</div>
										<div className="text-[9px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">Rate</div>
									</div>
									<div className="text-xl sm:text-3xl font-black text-blue-700 mb-1">
										{loading && data.length === 0 ? <Loader2 size={24} className="animate-spin text-blue-400" /> : `${successRate}%`}
									</div>
									<div className="text-[9px] sm:text-xs text-blue-600 font-medium">อัตราความสำเร็จ</div>
								</div>
							</div>
						)}

						{/* Modern Data Table */}
						<div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
							{/* Table Header */}
							<div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
								<div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
									<div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
										<Activity className="text-blue-600" size={16} />
									</div>
									<div className="flex-1 sm:flex-none">
										<h3 className="font-bold text-slate-800 text-sm sm:text-base">{selectedDate ? `Live Status: ${selectedDate}` : "กรุณาเลือก Billing Date"}</h3>
										<p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{data.length > 0 ? `แสดง ${data.length.toLocaleString()} รายการ` : "ยังไม่มีข้อมูล"}</p>
									</div>
								</div>

								<div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
									{data.length > 0 && (
										<>
											<button
												onClick={copyMeterIDs}
												className={`
													flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs shadow-lg transition-all duration-300
													${
														copied
															? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white scale-105 shadow-blue-500/50"
															: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:shadow-xl hover:-translate-y-0.5"
													}
												`}
											>
												{copied ? <Check size={14} /> : <Copy size={14} />}
												<span className="hidden sm:inline">{copied ? "Copied!" : "Copy IDs"}</span>
											</button>
											<button
												onClick={exportCSV}
												className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
											>
												<FileSpreadsheet size={14} />
												<span className="hidden sm:inline">Export CSV</span>
												<span className="sm:hidden">CSV</span>
											</button>
										</>
									)}
								</div>
							</div>

							{/* Table Content */}
							<div className="overflow-auto max-h-[calc(100vh-580px)] sm:max-h-[calc(100vh-480px)] custom-scrollbar">
								{loading && data.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-20">
										<Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
										<span className="text-slate-600 font-bold text-sm uppercase tracking-wider animate-pulse">กำลังโหลดข้อมูล...</span>
									</div>
								) : data.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-20 text-slate-400">
										<Database size={48} className="mb-4 opacity-30" />
										<p className="font-bold text-sm">กรุณาเลือก Billing Date เพื่อแสดงข้อมูล</p>
									</div>
								) : (
									<table className="w-full">
										<thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-white sticky top-0 z-10 shadow-lg">
											<tr>
												<th className="px-2 sm:px-6 py-1.5 sm:py-2 text-left text-[9px] sm:text-xs font-bold uppercase tracking-wider border-r border-slate-700">SPID</th>
												<th className="px-2 sm:px-6 py-1.5 sm:py-2 text-center text-[9px] sm:text-xs font-bold uppercase tracking-wider border-r border-slate-700">Meter ID</th>
												<th className="hidden md:table-cell px-2 sm:px-6 py-1.5 sm:py-2 text-right text-[9px] sm:text-xs font-bold uppercase tracking-wider border-r border-slate-700">
													Last Value
												</th>
												<th className="hidden lg:table-cell px-2 sm:px-6 py-1.5 sm:py-2 text-center text-[9px] sm:text-xs font-bold uppercase tracking-wider border-r border-slate-700">
													Reading Time
												</th>
												<th className="px-2 sm:px-6 py-1.5 sm:py-2 text-center text-[9px] sm:text-xs font-bold uppercase tracking-wider">Status</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100">
											{data.map((item, idx) => (
												<tr key={idx} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 group">
													<td className="px-2 sm:px-6 py-1.5 sm:py-2 font-bold text-slate-700 border-r border-slate-100 text-xs sm:text-sm">{item.ServicePointId}</td>
													<td className="px-2 sm:px-6 py-1.5 sm:py-2 text-slate-600 border-r border-slate-100 font-mono text-xs sm:text-sm text-center">{item.MeterID}</td>
													<td className="hidden md:table-cell px-2 sm:px-6 py-1.5 sm:py-2 font-bold text-slate-900 border-r border-slate-100 text-right text-xs sm:text-sm">
														{item.Latest_Value?.toLocaleString(undefined, { minimumFractionDigits: 3 }) || "-"}
													</td>
													<td className="hidden lg:table-cell px-2 sm:px-6 py-1.5 sm:py-2 text-slate-600 border-r border-slate-100 text-center">
														{item.Latest_Reading_Time ? (
															<div className="flex flex-col items-center gap-0.5">
																<span className="font-mono text-[10px] sm:text-xs font-semibold text-slate-700">
																	{new Date(item.Latest_Reading_Time).toLocaleDateString("th-TH", {
																		day: "2-digit",
																		month: "2-digit",
																		year: "numeric",
																	})}
																</span>
																<span className="font-mono text-[9px] sm:text-xs text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded">
																	{new Date(item.Latest_Reading_Time).toLocaleTimeString("th-TH", {
																		hour: "2-digit",
																		minute: "2-digit",
																		second: "2-digit",
																		hour12: false,
																	})}
																</span>
															</div>
														) : (
															<span className="text-slate-400 text-xs">-</span>
														)}
													</td>
													<td className="px-2 sm:px-6 py-1.5 sm:py-2 text-center">
														<span
															className={`
																inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold shadow-sm transition-all duration-200
																${
																	item.Status.startsWith("Found")
																		? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200"
																		: "bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border border-rose-200"
																}
															`}
														>
															{item.Status.startsWith("Found") ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
															<span className="hidden sm:inline">{item.Status}</span>
															<span className="sm:hidden">{item.Status.split(" ")[0]}</span>
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								)}
							</div>
						</div>

						{/* Modern Footer */}
						<div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 px-1 text-[10px] sm:text-xs text-slate-500 font-medium">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
								<span>
									User: <span className="font-bold text-slate-700">ativatk</span>
								</span>
							</div>
							<div className="flex items-center gap-2 sm:gap-3">
								<span className="text-slate-400">© 2026 IEE Monitor</span>
								<span className="px-2 sm:px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-600 flex items-center gap-1.5 sm:gap-2">
									{loading ? (
										<>
											<Loader2 size={10} className="animate-spin" />
											<span className="hidden sm:inline">UPDATING...</span>
											<span className="sm:hidden">UPDATE</span>
										</>
									) : (
										<>
											<Zap size={10} className="text-emerald-500" />
											<span className="hidden sm:inline">LIVE MODE</span>
											<span className="sm:hidden">LIVE</span>
										</>
									)}
								</span>
							</div>
						</div>
					</main>
				</div>
			</div>

			<style>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 8px;
					height: 8px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: #f1f5f9;
					border-radius: 10px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: linear-gradient(to bottom, #3b82f6, #06b6d4);
					border-radius: 10px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: linear-gradient(to bottom, #2563eb, #0891b2);
				}
			`}</style>
		</div>
	);
}

export default App;
