import React, { useEffect, useState, useRef } from 'react';
import {
	Clock,
	Wrench,
	Battery,
	Zap,
	Car,
	Eye,
	Shield,
	Lightbulb,
	ChevronUp,
	ChevronDown,
	X,
} from 'lucide-react';
import SelectCarPage from './SelectCarPage';
import { useNavigate } from 'react-router-dom';
import serviceImg from '../../assets/serviceimages/generalservice.png';
import AutoPopup from './RightSidePopup';
import { getAllServiceCategories } from '../../features/ServicesPage/service';
// import { postSparePartsData } from '../../features/spareparts';
import { FONTS } from '../../constants/constant';
import { useAuth } from '../auth/AuthContext';
import LoginPromptModal from '../../components/Authentication/LoginPromptModal';
import BookingModal from '../../components/service-centers/ServiceBookingModal';
import { postSparePartsData } from '../../features/spareparts';

interface ServiceItem {
	name: string;
	icon: React.ReactNode;
}

interface ServicePackage {
	id: string;
	title: string;
	warranty: string;
	frequency: string;
	isRecommended?: boolean;
	duration: string;
	services: ServiceItem[];
	additionalCount?: number;
	image: string;
	price: string;
	discountPrice: string;
}

interface ContentSection {
	title: string;
	packages: ServicePackage[];
}

interface CarSelect {
	id: string;
	model: string;
	year: string;
}

interface SelectedPackageInfo {
	packageId: string;
	carDetails: CarSelect;
}

interface ApiServiceCategory {
	_id: string;
	uuid: string;
	category_name: string;
	slug: string;
	services: ApiService[];
	is_active: boolean;
	is_deleted: boolean;
	createdAt: string;
	updatedAt: string;
}

interface ApiService {
	_id: string;
	uuid: string;
	service_name: string;
	description: string;
	price: number;
	slug: string;
	category_id: string;
	partner_id: string;
	is_active: boolean;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
}

const useScrollAnimation = <T extends HTMLElement = HTMLElement>(
	options = {}
) => {
	const [isVisible, setIsVisible] = useState(false);
	const elementRef = useRef<T>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsVisible(entry.isIntersecting);
			},
			{
				threshold: 0.1,
				rootMargin: '0px 0px -50px 0px',
				...options,
			}
		);

		if (elementRef.current) {
			observer.observe(elementRef.current);
		}

		return () => {
			if (elementRef.current) {
				observer.unobserve(elementRef.current);
			}
		};
	}, []);

	return { elementRef, isVisible };
};

const ServicesPage: React.FC = () => {
	const [selectedPackage, setSelectedPackage] = useState<SelectedPackageInfo[]>(
		[]
	);
	const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
		null
	);
	const [activeNavItem, setActiveNavItem] = useState<string>('');
	const [expandedServices, setExpandedServices] = useState<{
		[key: string]: boolean;
	}>({});
	const [cart, setCart] = useState<SelectedPackageInfo[]>([]);
	const [showWelcomePopup, setShowWelcomePopup] = useState(true);
	const [serviceCategories, setServiceCategories] = useState<
		ApiServiceCategory[]
	>([]);
	const navigate = useNavigate();
	const serviceTitle = useScrollAnimation<HTMLHeadingElement>();
	const [selectedCategory, setSelectedCategory] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const { isAuthenticated } = useAuth();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showCartNotification, setShowCartNotification] = useState(false);

	const fetchAllServiceCategory = async () => {
		try {
			const response: any = await getAllServiceCategories();
			if (response.data && response.data.data) {
				const categories = selectedCategory
					? response.data.data.filter(
						(cat: any) => cat._id === selectedCategory.id
					)
					: response.data.data;

				setServiceCategories(categories);
				const firstActiveCategory = response.data.data.find(
					(cat: any) => !cat.is_deleted
				);
				if (firstActiveCategory) {
					setActiveNavItem(
						selectedCategory
							? selectedCategory.name
							: firstActiveCategory.category_name
					);
				}
			}
		} catch (error) {
			console.error('Error fetching service categories:', error);
		}
	};

	useEffect(() => {
		fetchAllServiceCategory();
		setSelectedCategory(null);
	}, []);

	const storedCategory: any = localStorage.getItem('selectedCategory');

	useEffect(() => {
		if (storedCategory) {
			setActiveNavItem(storedCategory?.name);
			localStorage.removeItem('selectedCategory');
		}
	}, [storedCategory]);

	const mapApiToContentSections = (
		categories: ApiServiceCategory[]
	): { [key: string]: ContentSection } => {
		const contentSections: { [key: string]: ContentSection } = {};

		categories.forEach((category) => {
			if (category.is_deleted) return;

			const activeServices = category.services.filter(
				(service) => service.is_active && !service.is_deleted
			);

			const packages: ServicePackage[] = activeServices.map((service) => {
				const originalPrice = service.price;
				const discountPrice = Math.round(originalPrice * 1.2);

				return {
					id: service._id,
					title: service.service_name,
					warranty: '1000 Kms or 1 Month Warranty',
					frequency: 'As Required',
					duration: '2 Hrs Taken',
					image: serviceImg,
					services: [
						{
							name: service.description || 'Service description not available',
							icon: <Wrench className='w-4 h-4' />,
						},
					],
					price: `₹${discountPrice}`,
					discountPrice: `₹${originalPrice}`,
				};
			});

			contentSections[category.category_name] = {
				title: category.category_name,
				packages,
			};
		});

		return contentSections;
	};

	const contentSections = mapApiToContentSections(serviceCategories);
	const navigationItems = serviceCategories
		.filter((category) => !category.is_deleted)
		.map((category) => ({
			name: category.category_name,
			icon: getCategoryIcon(category.category_name),
			isActive:
				category.is_active &&
				category.services.some((s) => s.is_active && !s.is_deleted),
		}));

	function getCategoryIcon(categoryName: string): React.ReactNode {
		if (categoryName.includes('AC')) return <Zap className='w-6 h-6' />;
		if (categoryName.includes('Battery'))
			return <Battery className='w-6 h-6' />;
		if (categoryName.includes('Tyre') || categoryName.includes('Wheel'))
			return <Car className='w-6 h-6' />;
		if (categoryName.includes('Inspection')) return <Eye className='w-6 h-6' />;
		if (categoryName.includes('Light'))
			return <Lightbulb className='w-6 h-6' />;
		if (categoryName.includes('Insurance'))
			return <Shield className='w-6 h-6' />;
		return <Wrench className='w-6 h-6' />;
	}

	const handleSelectCar = (packageId: string) => {
		setSelectedPackageId(packageId);
		setShowForm(true);
	};

	const handleNavClick = (navItem: string) => {
		setActiveNavItem(navItem);
		setSelectedPackage([]);
	};

	const handleAddToCart = async (serviceId: string) => {
		if (!isAuthenticated) {
			setShowLoginModal(true);
		} else {
			setSelectedPackageId(serviceId);
			setIsModalOpen(true);
		}
	};

	const handleConfirmBooking = async (requestType: string, schedule_date: Date) => {
		if (!selectedPackageId) return;

		const packageToAdd = selectedPackage.find(
			(p) => p.packageId === selectedPackageId
		);

		if (packageToAdd) {
			setCart([...cart, packageToAdd]);
			try {
				const data = {
					service: selectedPackageId,
					type: 'service',
					requestType,
					schedule_date: schedule_date,
				};
				const response = await postSparePartsData(data);
				if (response) {
					setShowCartNotification(true);
					setTimeout(() => setShowCartNotification(false), 3000);
					if ((window as any).refreshCartCount) {
						(window as any).refreshCartCount();
					}
				}
			} catch (error) {
				console.log(error);
			}
		}
		setIsModalOpen(false);
	};

	const handleRemoveFromCart = (serviceId: string) => {
		setCart(cart.filter((item) => item.packageId !== serviceId));
		setSelectedPackage(
			selectedPackage.filter((item) => item.packageId !== serviceId)
		);
	};

	useEffect(() => {
		const hasDismissed = localStorage.getItem('dismissedWelcomePopup');
		if (!hasDismissed) {
			setShowWelcomePopup(true);
		}
	}, []);

	const handleCloseWelcome = () => {
		setShowWelcomePopup(false);
		localStorage.setItem('dismissedWelcomePopup', 'true');
	};

	const toggleExpandServices = (packageId: string) => {
		setExpandedServices((prev) => ({
			...prev,
			[packageId]: !prev[packageId],
		}));
	};

	// const handleAddToCart = () => {
	// 	console.log('Adding to cart...');
	// 	// Your add to cart logic here
	// 	setIsModalOpen(false);
	// };

	// const handleOpenSignUp = () => {
	// 	console.log('Opening sign up...');
	// 	// Your sign up logic here
	// };

	const [showForm, setShowForm] = useState<boolean>(false);
	const currentContent = activeNavItem ? contentSections[activeNavItem] : null;

	return (
		<div className='min-h-screen bg-gray-50 flex flex-start relative'>
			{/* Vertical Left Sidebar Navigation */}
			<div className='flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
				{/* Left Sidebar */}
				<div className='fixed left-0 top-8 w-[280px] h-[800px] bg-white shadow-2xl flex flex-col z-10 border-r border-[#0050A5]-50'>
					{/* Header Section */}
					<div className='p-6 border-b border-[#0050A5] flex-shrink-0 bg-gradient-to-r from-[#0050A5] to-[#0050A5]'>
						<div className='flex items-center space-x-3'>
							<div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm'>
								<svg
									className='w-6 h-6 text-white'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
									/>
								</svg>
							</div>
							<div>
								<h2 className='text-xl font-bold text-white'>Services</h2>
								<p className='text-red-100 text-sm font-medium'>Dashboard</p>
							</div>
						</div>
					</div>

					{/* Navigation Section */}
					<div className='flex-1 overflow-y-auto max-h-[calc(100vh-120px)] py-4 scrollbar-hide'>
						<nav className='px-4'>
							<div className='space-y-2'>
								{navigationItems.map((item, index) => (
									<div
										key={index}
										onClick={() => handleNavClick(item.name)}
										className={`group relative flex items-center px-4 py-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${activeNavItem === item.name
											? 'bg-gradient-to-r from-red-50 to-red-100 text-[#0050A5] shadow-lg shadow-[#0050A5]/20 border border-[#0050A5]'
											: 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-[#0050A5] hover:shadow-md'
											} ${!item.isActive ? 'opacity-70' : ''}`}
									>
										{activeNavItem === item.name && (
											<div className='absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-[#0050A5] rounded-r-full'></div>
										)}

										<div
											className={`mr-4 flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${activeNavItem === item.name
												? 'bg-[#BED0EC] text-[#0050A5]-600'
												: 'bg-gray-100 text-gray-500 group-hover:bg-[#BED0EC] group-hover:text-[#0050A5]]'
												}`}
										>
											{item.icon}
										</div>

										<span className='text-sm font-semibold whitespace-nowrap transition-all duration-300'>
											{item.name}
										</span>

										<div
											className={`ml-auto opacity-0 transform translate-x-2 transition-all duration-300 ${activeNavItem === item.name
												? 'opacity-100 translate-x-0'
												: 'group-hover:opacity-100 group-hover:translate-x-0'
												}`}
										>
											<svg
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M9 5l7 7-7 7'
												/>
											</svg>
										</div>
									</div>
								))}
							</div>
						</nav>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='ml-72 bg-gray-50'>
				<div className='mx-auto px-6 py-8'>
					<div className='mb-8'>
						<h1 ref={serviceTitle.elementRef} style={{ ...FONTS.sub_heading }}>
							<span className='inline-block pb-1 relative text-[#0050A5] mb-2'>
								{currentContent?.title || 'Services'}
								{/* <span
									className={`absolute top-11 left-1/2 h-[1px] bg-[#9b111e] transform -translate-x-1/2 origin-center transition-all duration-700 ${serviceTitle.isVisible
										? 'scale-x-100 w-full'
										: 'scale-x-0 w-full'
										}`}
								></span> */}
							</span>
						</h1>

						<p className='text-gray-500'>
							{currentContent
								? 'Choose the perfect package for your vehicle'
								: 'Select a service category'}
						</p>
					</div>

					{!currentContent || currentContent.packages.length === 0 ? (
						<div className='bg-[#BED0EC] rounded-lg shadow p-8 text-center w-[600px]'>
							<div className='text-[#0050A5] mb-4'>
								<Wrench className='w-12 h-12 mx-auto' />
							</div>
							<h3 className='text-lg font-medium text-[#0050A5] mb-2'>
								No Services Available
							</h3>
							<p className='text-gray-500'>
								There are currently no active services in this category.
							</p>
						</div>
					) : (
						<div className='space-y-8'>
							{currentContent.packages.map((pkg) => {
								const isSelected = selectedPackage.some(
									(p) => p.packageId === pkg.id
								);
								const isInCart = cart.some((item) => item.packageId === pkg.id);

								return (
									<div
										key={pkg.id}
										className={`bg-[#d8e1ef] rounded-lg lg:w-[600px] md:w-[400px] shadow-lg relative transition-all duration-300 hover:shadow-xl ${isSelected ? 'ring-2 ring-[#0050A5]-500' : ''
											}`}
									>
										{pkg.isRecommended && (
											<div className='absolute top-0 left-0 z-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-br-lg'>
												<span className='text-sm font-semibold bg-green-600 text-white px-3 py-1 rounded-md'>
													RECOMMENDED
												</span>
											</div>
										)}

										<div className='flex flex-col items-start w-full rounded-t-lg overflow-hidden'>
											{/* Service Image */}
											<div className='w-full h-[280px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 relative'>
												<img
													src={pkg.image}
													alt={pkg.title}
													className='w-full h-full object-cover'
													onError={(e) => {
														e.currentTarget.src =
															'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NS4zMzMzIDc1SDExNC42NjdNMTAwIDYwLjMzMzNWODkuNjY2N00xMDAgMTA1QzExNi41NjkgMTA1IDEzMCA5MS41Njg1IDEzMCA3NUMxMzAgNTguNDMxNSAxMTYuNTY5IDQ1IDEwMCA0NUM4My40MzE1IDQ1IDcwIDU4LjQzMTUgNzAgNzVDNzAgOTEuNTY4NSA4My40MzE1IDEwNSAxMDAgMTA1WiIgc3Ryb2tlPSIjOUI5QkEzIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
													}}
												/>
											</div>

											{/* Service Details */}
											<div className='flex-1 p-6'>
												<div className='flex justify-between items-start mb-4'>
													<div className='relative'>
														<h2
															className='text-[#0050A5] mb-2'
															style={{ ...FONTS.sub_heading2 }}
														>
															{pkg.title}
														</h2>
														<div className='absolute font-bold flex flex-row items-center w-[122px] bottom-[40px] left-[430px] px-3 py-1 rounded-full bg-[#0050A5] text-white text-sm'>
															<Clock className='w-4 h-4 mr-1' />
															{pkg.duration}
														</div>
														<div className='flex space-x-4 text-sm'>
															<span className='inline-flex items-center px-3 py-1 rounded-full opacity-70 text-[#0050A5]'>
																{pkg.warranty}
															</span>
															<span className='inline-flex items-center px-3 py-1 rounded-full opacity-70 text-[#0050A5]'>
																{pkg.frequency}
															</span>
														</div>
													</div>
												</div>

												{/* Services Grid */}
												<div className='grid grid-cols-1 gap-3 mb-4'>
													{pkg.services
														.slice(
															0,
															expandedServices[pkg.id] ? pkg.services.length : 4
														)
														.map((service, index) => (
															<div
																key={index}
																className='flex items-center text-sm text-[#0050A5] group'
															>
																<div className='w-5 h-5 bg-[#BED0EC] rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-[#BED0EC] transition-colors'>
																	<div>{service.icon}</div>
																</div>
																<span className='group-hover:text-gray-900 transition-colors'>
																	{service.name}
																</span>
															</div>
														))}
												</div>

												{pkg.additionalCount && (
													<div className='mb-6'>
														<button
															onClick={() => toggleExpandServices(pkg.id)}
															className='text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors flex items-center'
														>
															{expandedServices[pkg.id] ? (
																<>
																	<ChevronUp className='w-4 h-4 mr-1' />
																	Show Less
																</>
															) : (
																<>
																	<ChevronDown className='w-4 h-4' />
																	view more
																</>
															)}
														</button>
													</div>
												)}

												<div className='flex justify-between items-center mt-6'>
													{/* Price and Discount */}
													<div className='text-right mb-2'>
														{isSelected && (
															<>
																<span className='line-through text-gray-400 mr-2 text-sm'>
																	{pkg.price}
																</span>
																<span className='text-[#0050A5]-600 font-bold text-xl'>
																	{pkg.discountPrice}
																</span>
															</>
														)}
													</div>

													{/* Buttons */}
													{isSelected ? (
														<div className='flex items-center space-x-2'>
															{isInCart ? (
																<>
																	<button
																		onClick={() => {
																			navigate('/booking-cart');
																		}}
																		className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
																	>
																		Go to Cart
																	</button>
																	<button
																		onClick={() => handleRemoveFromCart(pkg.id)}
																		className='p-2 text-gray-500 hover:text-[#0050A5] transition-colors'
																		title='Remove from cart'
																	>
																		<X className='w-5 h-5' />
																	</button>
																</>
															) : (
																<>
																	<button
																		onClick={() => handleAddToCart(pkg.id)}
																		className='px-4 py-2 bg-[#0050A5] text-white rounded-md hover:bg-[#0050A5] transition-colors'
																	>
																		Add to Cart
																	</button>
																	<button
																		onClick={() => handleRemoveFromCart(pkg.id)}
																		className='px-4 py-2 border border-[#0050A5] rounded-md hover:bg-[#0050A5] hover:text-white transition-colors text-White'
																	>
																		Cancel
																	</button>
																</>
															)}
														</div>
													) : (
														<button
															onClick={() => handleSelectCar(pkg.id)}
															className='px-4 py-2 rounded-lg font-semibold bg-white border-2 border-[#0050A5] text-[#0050A5] hover:bg-[#0050A5]-50 hover:text-[#0050A5] transition-all duration-200 shadow-md hover:shadow-lg'
														>
															SELECT CAR
														</button>
													)}
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{/* Cart Notification */}
					{showCartNotification && (
						<div className='fixed top-[70px] right-[10px] transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50'>
							Item added to cart successfully!
						</div>
					)}
				</div>
			</div>

			{/* Car Selection Form Modal */}
			{showForm && selectedPackageId && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex justify-end items-center z-50 p-4'>
					<SelectCarPage
						onClose={() => setShowForm(false)}
						setSelectedPackage={(carDetails) => {
							const data: any = {
								packageId: selectedPackageId,
								carDetails,
							};
							setSelectedPackage((prev) => [...prev, data]);
							setShowForm(false);
						}}
						packageId={selectedPackageId}
					/>
				</div>
			)}

			{/* Welcome Popup */}
			<div>
				{showWelcomePopup && (
					<AutoPopup
						onClose={handleCloseWelcome}
						title='Welcome to Car Services'
						message='Explore our comprehensive service packages. Select what your vehicle needs and book an appointment with ease.'
					/>
				)}
			</div>
			<LoginPromptModal
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
			/>
			{/* Booking Modal */}

			{isModalOpen && selectedPackageId && (
				<BookingModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					selectedService={{
						id: selectedPackageId,
						duration: '2 hours',
						title: currentContent?.packages.find(
							(p) => p.id === selectedPackageId
						)?.title,
						price: Number(
							currentContent?.packages
								.find((p) => p.id === selectedPackageId)
								?.discountPrice.replace('₹', '') || 0
						),
					}}
					isAuthenticated={isAuthenticated}
					onAddToCart={handleConfirmBooking}
					onOpenSignUp={() => setShowLoginModal(true)}
				/>
			)}
		</div>
	);
};

export default ServicesPage;
