import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  MessageCircle,
  SlidersHorizontal,
  X,
  Leaf,
  Plus,
  LogOut,
  Package,
  ImagePlus,
  Pencil,
  Trash2,
  Settings,
  ChevronLeft,
  Check,
  LoaderCircle,
  LockKeyhole,
  CheckCircle2,
  Eye,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  configured,
  supabase,
  loadCatalog,
  isOwner,
  saveProduct,
  deleteProduct,
  saveSettings,
} from "./api";
import { defaultSettings, sampleProducts } from "./data";
import { money, filterProducts, whatsappLink } from "./domain";
import "./style.css";
const IconLogo = () => (
  <span className="logo-mark">
    A<span>•</span>
  </span>
);
function BrandName({ name }) {
  return name === "AAMUKTHA Drapes & Delights" ? (
    <span className="brand-name">
      <strong>AAMUKTHA</strong>
      <small>Drapes &amp; Delights</small>
    </span>
  ) : (
    <span className="brand-name">{name}</span>
  );
}
function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.showModal();
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-top">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function WhatsApp({ settings, product, className = "button green", children }) {
  const link = whatsappLink(
    settings.whatsapp_number,
    product,
    settings.business_name,
  );
  return link ? (
    <a
      className={className}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle size={18} />
      {children || "Ask on WhatsApp"}
      <ArrowUpRight size={16} />
    </a>
  ) : (
    <span
      className={`${className} disabled`}
      title="The owner has not added a WhatsApp number yet"
    >
      <MessageCircle size={18} />
      Contact coming soon
    </span>
  );
}
function ProductImage({ product, ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.image_url]);
  return product.image_url && !failed ? (
    <img
      src={product.image_url}
      alt={product.name}
      onError={() => setFailed(true)}
      {...props}
    />
  ) : (
    <div className="image-placeholder">
      <Package size={44} />
      <span>Photo unavailable</span>
    </div>
  );
}
function App() {
  const [admin, setAdmin] = useState(location.pathname.startsWith("/admin"));
  const [products, setProducts] = useState(configured ? [] : sampleProducts);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    availableOnly: false,
    sort: "newest",
  });
  const [session, setSession] = useState(null);
  const [owner, setOwner] = useState(false);
  const [authChecking, setAuthChecking] = useState(configured);
  const [notice, setNotice] = useState("");
  const reload = async (ownerView = owner && admin) => {
    if (!configured) return;
    setLoading(true);
    setError("");
    try {
      const data = await loadCatalog(ownerView);
      setProducts(data.products);
      setSettings(data.settings);
    } catch {
      setError(
        "We couldn’t load the collection. Please try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error)
        setError(
          "Your login session could not be restored. Please sign in again.",
        );
      setSession(data.session);
      setAuthChecking(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (!session) {
      setOwner(false);
      return;
    }
    isOwner()
      .then((value) => {
        if (active) setOwner(value);
      })
      .catch(() => {
        if (active) setOwner(false);
      });
    return () => {
      active = false;
    };
  }, [session]);
  useEffect(() => {
    reload();
  }, [owner, admin]);
  useEffect(() => {
    if (!configured) return;
    const refresh = () => {
      if (document.visibilityState === "visible") reload();
    };
    const timer = setInterval(refresh, 30 * 60 * 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [owner, admin]);
  useEffect(() => {
    document.title = `${settings.business_name} — ${admin ? "Owner dashboard" : "The everyday collection"}`;
  }, [settings.business_name, admin]);
  useEffect(() => {
    const pop = () => {
      setAdmin(location.pathname.startsWith("/admin"));
      setSelected(null);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  function navigate(to) {
    history.pushState({}, "", to);
    setAdmin(to === "/admin");
    setSelected(null);
    window.scrollTo(0, 0);
  }
  const categories = [
    "All",
    ...new Set(products.filter((p) => p.published).map((p) => p.category)),
  ];
  const visible = filterProducts(
    products.filter((p) => p.published),
    filters,
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        <span>Discover the collection. Connect directly on WhatsApp.</span>
        <span className="announcement-right">
          <span className="tiny-dot" />A little something for your everyday
        </span>
      </div>
      <header>
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <IconLogo />
          <BrandName name={settings.business_name} />
          {settings.business_name.length < 20 && (
            <span className="brand-suffix">COLLECTION</span>
          )}
        </a>
        <nav aria-label="Main navigation">
          {admin ? (
            <button className="text-button" onClick={() => navigate("/")}>
              <ChevronLeft size={16} />
              View collection
            </button>
          ) : (
            <>
              <a href="#collection">The collection</a>
              <a href="#how-it-works">How it works</a>
              <button
                className="nav-contact"
                onClick={() =>
                  document
                    .getElementById("contact")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Let’s talk
                <ArrowUpRight size={16} />
              </button>
            </>
          )}
        </nav>
      </header>
      {admin ? (
        <Admin
          {...{
            products,
            settings,
            session,
            owner,
            authChecking,
            loading,
            error,
            reload,
            setSettings,
            setNotice,
          }}
        />
      ) : (
        <main id="main">
          <section className="hero wrap">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="line" />
                THOUGHTFULLY COLLECTED. SIMPLY SHARED.
              </div>
              <h1>
                {settings.tagline === "Good things, simply found." ? (
                  <>
                    Good things,
                    <br />
                    <em>simply found.</em>
                  </>
                ) : (
                  settings.tagline
                )}
              </h1>
              <p>{settings.description}</p>
              <a className="button green" href="#collection">
                Explore the collection
                <ArrowRight size={19} />
              </a>
              <div className="hero-footnote">
                <span className="mini-icon">
                  <Leaf size={17} />
                </span>
                <span>
                  Browse at your pace.
                  <br />
                  <strong>We’re a message away.</strong>
                </span>
              </div>
            </div>
            <div className="hero-art">
              <img
                src="/images/hero.svg"
                alt="Illustrated styling of a lamp, ceramic vase and everyday accessories"
              />
              <div className="hero-art-label">
                <span>THE EVERYDAY EDIT</span>
                <span>01 / A few favourites</span>
              </div>
              <span className="art-stamp">
                A LITTLE
                <br />
                EVERYDAY
                <br />
                <em>inspiration</em>
              </span>
            </div>
          </section>
          <div className="service-strip">
            <span>
              <CheckCircle2 />
              Clear prices
            </span>
            <span>
              <ImagePlus />A closer look at every product
            </span>
            <span>
              <MessageCircle />A real conversation, on WhatsApp
            </span>
          </div>
          <section id="collection" className="collection wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">FIND YOUR NEXT FAVOURITE</div>
                <h2>
                  The collection<span>.</span>
                </h2>
              </div>
              <p>
                Take a look around.
                <br />
                Something catch your eye? Just ask us.
              </p>
            </div>
            {!configured && (
              <div className="sample-note">
                <Eye size={17} />
                <span>
                  Sample collection — illustrated products and prices for
                  preview.
                </span>
              </div>
            )}
            <div className="catalog-toolbar">
              <div
                className="tabs"
                role="group"
                aria-label="Product categories"
              >
                {categories.map((c) => (
                  <button
                    key={c}
                    className={filters.category === c ? "active" : ""}
                    onClick={() => setFilters({ ...filters, category: c })}
                  >
                    {c}
                    {c === "All" && (
                      <span>{products.filter((p) => p.published).length}</span>
                    )}
                  </button>
                ))}
              </div>
              <label className="search">
                <Search size={18} />
                <input
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  placeholder="Find something you love"
                  aria-label="Search products"
                />
                {filters.search && (
                  <button
                    className="icon-button"
                    aria-label="Clear search"
                    onClick={() => setFilters({ ...filters, search: "" })}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
            </div>
            <div className="results-bar">
              <span>
                {loading
                  ? "Loading collection…"
                  : `${visible.length} ${visible.length === 1 ? "product" : "products"}`}
              </span>
              <div>
                <label className="available-filter">
                  <input
                    type="checkbox"
                    checked={filters.availableOnly}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        availableOnly: e.target.checked,
                      })
                    }
                  />
                  In stock only
                </label>
                <label className="sort">
                  <SlidersHorizontal size={14} />
                  <select
                    value={filters.sort}
                    aria-label="Sort products"
                    onChange={(e) =>
                      setFilters({ ...filters, sort: e.target.value })
                    }
                  >
                    <option value="newest">Latest additions</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
              </div>
            </div>
            {error ? (
              <div className="empty-state" role="alert">
                <AlertCircle />
                <h3>Let’s try that again</h3>
                <p>{error}</p>
                <button className="button outline" onClick={() => reload()}>
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="product-grid">
                {[1, 2, 3].map((i) => (
                  <div className="skeleton" key={i} />
                ))}
              </div>
            ) : visible.length ? (
              <div className="product-grid">
                {visible.map((p) => (
                  <article className="product-card" key={p.id}>
                    <button
                      className="product-photo"
                      onClick={() => setSelected(p)}
                      aria-label={`View ${p.name}`}
                    >
                      <ProductImage product={p} loading="lazy" />
                      {!p.available && (
                        <span className="stock-tag sold">
                          Currently unavailable
                        </span>
                      )}
                      {p.available && (
                        <span className="stock-tag">
                          <span className="tiny-dot" />
                          Available
                        </span>
                      )}
                      <span className="photo-open">
                        <ArrowUpRight size={20} />
                      </span>
                    </button>
                    <div className="product-info">
                      <div>
                        <span className="category-label">{p.category}</span>
                        <h3>
                          <button onClick={() => setSelected(p)}>
                            {p.name}
                          </button>
                        </h3>
                      </div>
                      <span className="price">{money(p.price)}</span>
                    </div>
                    <button
                      className="product-detail-link"
                      onClick={() => setSelected(p)}
                    >
                      Take a closer look
                      <ArrowRight size={15} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search />
                <h3>
                  {products.length
                    ? "No matches just yet"
                    : "The collection is on its way"}
                </h3>
                <p>
                  {products.length
                    ? "Try a different search or explore another category."
                    : "Check back soon for new products."}
                </p>
                {products.length > 0 && (
                  <button
                    className="button outline"
                    onClick={() =>
                      setFilters({
                        search: "",
                        category: "All",
                        availableOnly: false,
                        sort: "newest",
                      })
                    }
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </section>
          <section id="how-it-works" className="how-section">
            <div className="wrap">
              <div className="section-head">
                <div>
                  <div className="eyebrow">LESS CLICKING. MORE CONNECTING.</div>
                  <h2>See it. Love it. Let’s talk.</h2>
                </div>
                <span className="how-doodle">
                  <MessageCircle size={48} />
                </span>
              </div>
              <div className="steps">
                <div>
                  <span>01</span>
                  <h3>Find your favourite</h3>
                  <p>
                    Explore the photos, prices and availability in our
                    collection.
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <h3>Say hello on WhatsApp</h3>
                  <p>
                    Ask about a product, request more details or check what’s
                    available.
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <h3>We’ll take it from there</h3>
                  <p>
                    Discuss your order directly with us. Everything happens in
                    your chat.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="contact-section wrap" id="contact">
            <div>
              <div className="eyebrow">A QUESTION? A FAVOURITE? A HELLO?</div>
              <h2>
                Good conversations
                <br />
                start with a message.
              </h2>
              <p>We’re here to help you find the right thing.</p>
            </div>
            <WhatsApp settings={settings}>Let’s talk on WhatsApp</WhatsApp>
          </section>
        </main>
      )}
      <footer>
        <div className="wrap footer-inner">
          <a
            className="brand"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            <IconLogo />
            <BrandName name={settings.business_name} />
          </a>
          <span>A collection to explore. A conversation to connect.</span>
          <button
            className="text-button owner-link"
            onClick={() => navigate("/admin")}
          >
            <LockKeyhole size={13} />
            Owner login
          </button>
        </div>
      </footer>
      {selected && (
        <Modal title="A closer look" onClose={() => setSelected(null)} wide>
          <div className="product-dialog">
            <div className="detail-photo">
              <ProductImage product={selected} />
            </div>
            <div className="detail-copy">
              <span className="category-label">{selected.category}</span>
              <h2>{selected.name}</h2>
              <span className="detail-price">{money(selected.price)}</span>
              <p
                className={`availability ${!selected.available ? "unavailable" : ""}`}
              >
                <span className="tiny-dot" />
                {selected.available
                  ? "Available — ask us for the details"
                  : "Currently unavailable — ask about restocking"}
              </p>
              <p>{selected.description}</p>
              <WhatsApp settings={settings} product={selected} />
              <small>
                Enquiries and orders are handled directly on WhatsApp.
              </small>
            </div>
          </div>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
function Admin({
  products,
  settings,
  session,
  owner,
  authChecking,
  loading,
  error,
  reload,
  setSettings,
  setNotice,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [editing, setEditing] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setPassword("");
    } catch {
      setAuthError(
        "Unable to sign in. Check your email and password and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError("Unable to sign out. Try again.");
  }
  if (!configured)
    return (
      <main id="main" className="login-page">
        <div className="login-card">
          <span className="login-icon">
            <Settings />
          </span>
          <div className="eyebrow">OWNER DASHBOARD</div>
          <h1>
            Your collection,
            <br />
            <em>your way.</em>
          </h1>
          <p>
            The catalog preview is ready. Connect your Supabase project to
            enable secure owner login and product uploads.
          </p>
          <div className="info-message">
            Owner management becomes available after deployment setup. The
            sample catalog does not store changes.
          </div>
          <a className="button green" href="/">
            Back to the collection
            <ArrowRight size={16} />
          </a>
        </div>
      </main>
    );
  if (authChecking)
    return (
      <main id="main" className="login-page">
        <LoaderCircle className="spin" aria-label="Checking login" />
      </main>
    );
  if (!session)
    return (
      <main id="main" className="login-page">
        <form className="login-card" onSubmit={login}>
          <span className="login-icon">
            <LockKeyhole />
          </span>
          <div className="eyebrow">JUST FOR THE OWNER</div>
          <h1>
            Welcome
            <br />
            <em>back.</em>
          </h1>
          <p>Sign in to look after your collection.</p>
          <label>
            Email address
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {authError && (
            <div role="alert" className="error-message">
              {authError}
            </div>
          )}
          <button className="button green" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <>
                Sign in
                <ArrowRight size={18} />
              </>
            )}
          </button>
          <small>Access is restricted to the designated owner account.</small>
        </form>
      </main>
    );
  if (!owner)
    return (
      <main id="main" className="login-page">
        <div className="login-card">
          <LockKeyhole />
          <h1>Owner access required</h1>
          <p>
            This account has not been granted permission to manage the
            collection. If you are the owner, complete the owner setup in
            Supabase.
          </p>
          <button className="button outline" onClick={signOut}>
            Sign out
          </button>
        </div>
      </main>
    );
  const filtered = filterProducts(products, { search: query });
  return (
    <main id="main" className="admin-page wrap">
      <div className="admin-title">
        <div>
          <div className="eyebrow">YOUR SPACE TO CREATE</div>
          <h1>
            The owner’s desk<span>.</span>
          </h1>
          <p>A little care for your collection goes a long way.</p>
        </div>
        <button className="text-button" onClick={signOut}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
      <div className="admin-stats">
        <div>
          <Package />
          <strong>{products.length}</strong>
          <span>Total products</span>
        </div>
        <div>
          <Eye />
          <strong>{products.filter((p) => p.published).length}</strong>
          <span>Published</span>
        </div>
        <div>
          <CheckCircle2 />
          <strong>
            {products.filter((p) => p.available && p.published).length}
          </strong>
          <span>Available now</span>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="search">
          <Search size={17} />
          <input
            placeholder="Search your products"
            aria-label="Search your products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div>
          <button
            className="button outline"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={16} />
            Store settings
          </button>
          <button className="button green" onClick={() => setEditing({})}>
            <Plus size={18} />
            Add product
          </button>
        </div>
      </div>
      {error && (
        <div className="error-message" role="alert">
          {error}
          <button className="text-button" onClick={() => reload(true)}>
            Try again
          </button>
        </div>
      )}
      {authError && (
        <div className="error-message" role="alert">
          {authError}
        </div>
      )}
      {loading ? (
        <div className="empty-state">
          <LoaderCircle className="spin" />
        </div>
      ) : filtered.length ? (
        <div className="admin-list">
          {filtered.map((p) => (
            <div className="admin-product" key={p.id}>
              <div className="admin-thumb">
                <ProductImage product={p} />
              </div>
              <div className="admin-product-name">
                <strong>{p.name}</strong>
                <span>
                  {p.category} · {money(p.price)}
                </span>
              </div>
              <span className={`pill ${!p.published ? "muted" : ""}`}>
                {p.published ? "Published" : "Hidden"}
              </span>
              <span className={`pill ${!p.available ? "muted" : ""}`}>
                {p.available ? "Available" : "Unavailable"}
              </span>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => setEditing(p)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => setDeleting(p)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Package />
          <h3>
            {query ? "No products match" : "Make room for your first favourite"}
          </h3>
          <p>
            {query
              ? "Try searching for something else."
              : "Add a photo, a price and a few details to start your collection."}
          </p>
          {!query && (
            <button className="button green" onClick={() => setEditing({})}>
              <Plus size={18} />
              Add your first product
            </button>
          )}
        </div>
      )}
      {editing && (
        <ProductForm
          product={editing}
          categories={[...new Set(products.map((p) => p.category))]}
          onClose={() => setEditing(null)}
          onSave={async () => {
            setEditing(null);
            await reload(true);
            setNotice("Product saved. Your collection is up to date.");
          }}
        />
      )}
      {settingsOpen && (
        <SettingsForm
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={async () => {
            setSettingsOpen(false);
            await reload(true);
            setNotice("Store settings saved.");
          }}
        />
      )}
      {deleting && (
        <Modal
          title="Delete this product?"
          onClose={() => !busy && setDeleting(null)}
        >
          <p>
            “{deleting.name}” and its photo will be removed from the collection.
          </p>
          {authError && (
            <div className="error-message" role="alert">
              {authError}
            </div>
          )}
          <div className="form-actions">
            <button
              disabled={busy}
              className="button outline"
              onClick={() => setDeleting(null)}
            >
              Keep product
            </button>
            <button
              disabled={busy}
              className="button danger-button"
              onClick={async () => {
                setBusy(true);
                setAuthError("");
                try {
                  await deleteProduct(deleting);
                  setDeleting(null);
                  await reload(true);
                  setNotice("Product deleted.");
                } catch (e) {
                  setAuthError(e.message);
                  await reload(true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting…" : "Delete product"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
function ProductForm({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product.name || "",
    price: product.price ?? "",
    category: product.category || "",
    description: product.description || "",
    available: product.available ?? true,
    published: product.published ?? true,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(product.image_url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const change = (e) =>
    setForm({
      ...form,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  return (
    <Modal
      title={product.id ? "Edit your product" : "Add something lovely"}
      onClose={() => !busy && onClose()}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await saveProduct(form, file, product.id ? product : null);
            await onSave();
          } catch (err) {
            setError(err.message || "Unable to save. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="upload-box">
          {preview ? (
            <img src={preview} alt="Product photo preview" />
          ) : (
            <ImagePlus size={32} />
          )}
          <span>
            {preview ? "Choose a different photo" : "Add a product photo"}
          </span>
          <small>
            JPG, PNG or WebP · up to 15 MB · compressed automatically
          </small>
          <input
            aria-label="Product photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={!product.image_path}
            onChange={(e) => {
              setFile(e.target.files[0] || null);
            }}
          />
        </label>
        <label>
          Product name
          <input
            name="name"
            value={form.name}
            onChange={change}
            required
            maxLength={100}
            placeholder="e.g. Earth ceramic vase"
          />
        </label>
        <div className="form-columns">
          <label>
            Price (₹)
            <input
              name="price"
              type="number"
              min="0"
              max="99999999"
              step="0.01"
              required
              value={form.price}
              onChange={change}
            />
          </label>
          <label>
            Category
            <input
              name="category"
              list="categories"
              value={form.category}
              onChange={change}
              required
              maxLength={50}
              placeholder="e.g. Home & living"
            />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>
        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            rows={4}
            maxLength={2000}
            placeholder="The details your customers will want to know"
          />
        </label>
        <label className="checkbox-label">
          <input
            name="available"
            type="checkbox"
            checked={form.available}
            onChange={change}
          />
          Available now
        </label>
        <label className="checkbox-label">
          <input
            name="published"
            type="checkbox"
            checked={form.published}
            onChange={change}
          />
          Publish in the customer collection
        </label>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <button
            type="button"
            disabled={busy}
            className="button outline"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button green" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="spin" size={18} />
                Saving…
              </>
            ) : (
              <>
                <Check size={18} />
                Save product
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function SettingsForm({ settings, onClose, onSave }) {
  const [form, setForm] = useState({
    business_name: settings.business_name,
    tagline: settings.tagline,
    description: settings.description,
    whatsapp_number: settings.whatsapp_number,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <Modal title="Make it yours" onClose={() => !busy && onClose()}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await saveSettings(form);
            await onSave();
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Business name
          <input
            name="business_name"
            required
            maxLength={80}
            value={form.business_name}
            onChange={change}
          />
        </label>
        <label>
          Headline
          <input
            name="tagline"
            required
            maxLength={100}
            value={form.tagline}
            onChange={change}
          />
        </label>
        <label>
          Introduction
          <textarea
            name="description"
            required
            maxLength={500}
            rows={3}
            value={form.description}
            onChange={change}
          />
        </label>
        <label>
          WhatsApp number
          <input
            name="whatsapp_number"
            type="tel"
            placeholder="+91 followed by your number"
            value={form.whatsapp_number}
            onChange={change}
          />
          <small>
            Include country code. This number will be visible to customers.
          </small>
        </label>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="button outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button disabled={busy} className="button green">
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
createRoot(document.getElementById("root")).render(<App />);
